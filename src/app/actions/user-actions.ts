'use server';

import { ensureInitialized, getStatements, rowToUser } from '@/lib/database';
import { User } from '@/lib/data';

export interface CreateUserResult {
  success: boolean;
  data?: User;
  error?: string;
}

// Create or get a user
export async function createOrGetUser(userData: User): Promise<CreateUserResult> {
  try {
    ensureInitialized();
    const statements = getStatements();
    
    // Check if user already exists
    const existingUser = statements.getUserById.get(userData.id);
    if (existingUser) {
      return {
        success: true,
        data: rowToUser(existingUser)
      };
    }
    
    // Create new user
    statements.insertUser.run(userData.id, userData.name, userData.email, userData.avatar || null);
    
    // Return the created user
    const createdUser = statements.getUserById.get(userData.id);
    return {
      success: true,
      data: rowToUser(createdUser)
    };
  } catch (error) {
    console.error('Error creating/getting user:', error);
    return {
      success: false,
      error: 'Failed to create or get user'
    };
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string, 
  updates: { name?: string; email?: string }
): Promise<CreateUserResult> {
  try {
    ensureInitialized();
    const statements = getStatements();
    
    // Check if user exists
    const existingUser = statements.getUserById.get(userId);
    if (!existingUser) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    // Update user - using parameterized query for safety
    const updateQuery = `
      UPDATE users 
      SET name = ?, email = ?
      WHERE id = ?
    `;
    
    statements.db.prepare(updateQuery).run(
      updates.name || existingUser.name,
      updates.email || existingUser.email,
      userId
    );
    
    // Return the updated user
    const updatedUser = statements.getUserById.get(userId);
    return {
      success: true,
      data: rowToUser(updatedUser)
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      error: 'Failed to update profile'
    };
  }
}