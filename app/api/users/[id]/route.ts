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
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', params.id)
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
  const action = request.nextUrl.searchParams.get('action');
  
  try {
    if (action === 'grant' || action === 'revoke') {
      const hasAccess = action === 'grant';
      const { data, error } = await supabase
        .from('users')
        .update({ hasAccess })
        .eq('id', params.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    } 
    else if (action === 'bindCard') {
      // Handle binding card to student
      const body = await request.json();
      const { cardId } = body;

      if (!cardId) {
        return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
      }

      // Check if the card is already bound to another student
      const { data: existingCard, error: checkError } = await supabase
        .from('users')
        .select('id, name')
        .eq('card_id', cardId)
        .single();

      if (existingCard && existingCard.id !== params.id) {
        return NextResponse.json({ 
          error: `Карта уже связана со студентом ${existingCard.name}` 
        }, { status: 400 });
      }

      // Bind card to the student
      const { data, error } = await supabase
        .from('users')
        .update({ card_id: cardId })
        .eq('id', params.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
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
  try {
    // First check if user has any equipment checked out
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('id, name')
      .eq('checkedOutBy', params.id);

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
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 