import { NextRequest, NextResponse } from 'next/server';
import { 
  getUserById, 
  updateUser,
  grantAccess,
  revokeAccess,
  getUserEquipment,
  deleteUser
} from '../../../../utils/userService';
import { mapUserToStudent, mapEquipmentToFrontend } from '../../../../lib/api';
import { supabase } from '../../../../utils/supabase';

// GET /api/users/[id] - get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/users/[id] - update user
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  
  try {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();
    
    // Transform frontend to backend format
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.group !== undefined) updates.group_name = body.group;
    if (body.hasAccess !== undefined) updates.has_access = body.hasAccess;
    if (body.email !== undefined) updates.email = body.email;
    if (body.phone !== undefined) updates.phone = body.phone;
    
    const updatedUser = await updateUser(userId, updates);
    const mappedUser = mapUserToStudent(updatedUser);
    
    return NextResponse.json(mappedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// POST /api/users/[id]/access - grant or revoke access
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const action = request.nextUrl.searchParams.get('action');
  
  try {
    if (action === 'grant' || action === 'revoke') {
      const hasAccess = action === 'grant';
      const { data, error } = await supabase
        .from('users')
        .update({ has_access: hasAccess })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

      // Map DB response to frontend format
      const mappedStudent = mapUserToStudent(data);
      return NextResponse.json(mappedStudent);
    } 
    else if (action === 'bindCard') {
      // Handle binding card to student
      const body = await request.json();
      const { cardId } = body;

      // If cardId is null or undefined, unbind the card
      if (cardId === null || cardId === undefined) {
        const { data, error } = await supabase
          .from('users')
          .update({ card_id: null })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error unbinding card:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const mappedStudent = mapUserToStudent(data);
        return NextResponse.json(mappedStudent);
      }

      // If cardId is empty string, treat as error
      if (!cardId || cardId.trim() === '') {
        return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
      }

      // Check if the card is already bound to another student
      // Use select without .single() to handle case where no records exist
      const { data: existingCards, error: checkError } = await supabase
        .from('users')
        .select('id, name')
        .eq('card_id', cardId);

      if (checkError) {
        console.error('Error checking existing card:', checkError);
        return NextResponse.json({ error: 'Failed to check card binding' }, { status: 500 });
      }

      // Check if card is bound to a different user
      const existingCard = existingCards && existingCards.length > 0 ? existingCards[0] : null;
      if (existingCard && existingCard.id !== parseInt(id)) {
        return NextResponse.json({ 
          error: `Карта уже связана со студентом ${existingCard.name}` 
        }, { status: 400 });
      }

      // If card is already bound to the same user, just return success
      if (existingCard && existingCard.id === parseInt(id)) {
        // Get the user data and return it
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();

        if (userError) {
          return NextResponse.json({ error: userError.message }, { status: 500 });
        }

        const mappedStudent = mapUserToStudent(userData);
        return NextResponse.json(mappedStudent);
      }

      // Bind card to the student (new binding)
      const { data, error } = await supabase
        .from('users')
        .update({ card_id: cardId })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error binding card:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Map DB response to frontend format
      const mappedStudent = mapUserToStudent(data);
      return NextResponse.json(mappedStudent);
    }
    else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/users/[id] - delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  
  try {
    // First check if user has any equipment checked out
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('id, name')
      .eq('checked_out_by', id);

    if (equipmentError) {
      return NextResponse.json({ error: equipmentError.message }, { status: 500 });
    }

    // If user has equipment checked out, prevent deletion
    if (equipment && equipment.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete user with equipment checked out',
        equipment
      }, { status: 400 });
    }

    // Delete the user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 