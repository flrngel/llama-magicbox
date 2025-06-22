import { getStatements, rowToSolution, rowToDataItem, rowToUser } from './database';
import { User, Solution, DataItem } from './data';

// User operations
export function createUser(user: Omit<User, 'id'> & { id: string }): User {
  const statements = getStatements();
  statements.insertUser.run(user.id, user.name, user.email, user.avatar || null);
  return user;
}

export function getUserById(id: string): User | undefined {
  const statements = getStatements();
  const row = statements.getUserById.get(id);
  return row ? rowToUser(row) : undefined;
}

export function getUserByEmail(email: string): User | undefined {
  const statements = getStatements();
  const row = statements.getUserByEmail.get(email);
  return row ? rowToUser(row) : undefined;
}

// Solution operations
export function getSolutions(): Solution[] {
  const statements = getStatements();
  const rows = statements.getAllSolutions.all();
  return rows.map((row: any) => {
    const solution = rowToSolution(row);
    // Get training data items for this solution
    const dataItems = getDataItemsForSolution(solution.id);
    solution.trainingDataItems = dataItems.map(item => item.id);
    return solution;
  });
}

export function getSolutionsByCreator(creatorId: string): Solution[] {
  const statements = getStatements();
  const rows = statements.getSolutionsByCreator.all(creatorId);
  return rows.map((row: any) => {
    const solution = rowToSolution(row);
    // Get training data items for this solution
    const dataItems = getDataItemsForSolution(solution.id);
    solution.trainingDataItems = dataItems.map(item => item.id);
    return solution;
  });
}

export function getSolutionById(id: string): Solution | undefined {
  const statements = getStatements();
  const row = statements.getSolutionById.get(id);
  if (!row) return undefined;
  
  const solution = rowToSolution(row);
  // Get training data items for this solution
  const dataItems = getDataItemsForSolution(solution.id);
  solution.trainingDataItems = dataItems.map(item => item.id);
  return solution;
}

export function getSolutionBySlug(slug: string): Solution | undefined {
  const statements = getStatements();
  const row = statements.getSolutionBySlug.get(slug);
  if (!row) return undefined;
  
  const solution = rowToSolution(row);
  // Get training data items for this solution
  const dataItems = getDataItemsForSolution(solution.id);
  solution.trainingDataItems = dataItems.map(item => item.id);
  return solution;
}

export function getCategories(): string[] {
  // This could be optimized with a proper query, but for now we'll use the enum values
  return ['Tax & Finance', 'Medical & Insurance', 'Rental & Legal', 'Personal Organization'];
}

export function updateSolution(solutionId: string, updates: Partial<Solution>): Solution | undefined {
  const statements = getStatements();
  const current = getSolutionById(solutionId);
  if (!current) return undefined;

  statements.updateSolution.run(
    updates.name ?? current.name,
    updates.description ?? current.description,
    updates.problemDescription ?? current.problemDescription,
    updates.targetUsers ?? current.targetUsers,
    updates.systemInstructions ?? current.systemInstructions,
    updates.modelOutputStructure ?? current.modelOutputStructure,
    solutionId
  );

  return getSolutionById(solutionId);
}

export function incrementSolutionUsage(solutionId: string): void {
  const statements = getStatements();
  statements.incrementUsageCount.run(solutionId);
}

// Data item operations
export function getDataItemsForSolution(solutionId: string): DataItem[] {
  const statements = getStatements();
  const rows = statements.getDataItemsBySolutionId.all(solutionId);
  return rows.map(rowToDataItem);
}

export function createDataItem(dataItem: Omit<DataItem, 'createdAt' | 'updatedAt'>): DataItem {
  const statements = getStatements();
  statements.insertDataItem.run(
    dataItem.id,
    dataItem.solutionId,
    dataItem.type,
    dataItem.content_uri,
    dataItem.guided_prompt,
    dataItem.model_output ? JSON.stringify(dataItem.model_output) : null
  );

  // Return the created data item with timestamps
  return {
    ...dataItem,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function updateDataItemModelOutput(id: string, modelOutput: Record<string, any>): void {
  const statements = getStatements();
  statements.updateDataItemModelOutput.run(JSON.stringify(modelOutput), id);
}

// Complex operations
export function publishSolutionWithDataItems(
  solutionData: Omit<Solution, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating' | 'trainingDataItems'>,
  dataItemsData: Omit<DataItem, 'id' | 'solutionId' | 'createdAt' | 'updatedAt'>[]
): Solution {
  // 1. Ensure the creator exists in the database
  const statements = getStatements();
  let user = getUserById(solutionData.creatorId);
  
  if (!user) {
    // Create user if they don't exist (for users from frontend auth)
    let userEmail: string;
    let userName: string;
    
    // Handle demo user case
    if (solutionData.creatorId === '1') {
      userEmail = 'demo@example.com';
      userName = 'Demo User';
    } else {
      // Extract username from creator field (format: "by Username")
      userName = solutionData.creator.startsWith('by ') ? 
        solutionData.creator.substring(3) : 
        solutionData.creator;
      
      // Generate email for the user
      userEmail = `user${solutionData.creatorId}@example.com`;
    }
    
    createUser({
      id: solutionData.creatorId,
      name: userName,
      email: userEmail,
      avatar: `https://avatar.vercel.sh/${userEmail}`
    });
  }

  // 2. Generate solution ID and slug
  const solutionId = `sol-${Date.now()}`;
  const slug = solutionData.name.toLowerCase().replace(/\s+/g, '-').slice(0, 50);

  // 3. Insert the solution
  statements.insertSolution.run(
    solutionId,
    slug,
    solutionData.name,
    solutionData.description,
    solutionData.problemDescription,
    solutionData.targetUsers,
    solutionData.creatorId,
    solutionData.creator,
    0, // usageCount
    0, // rating
    solutionData.category,
    solutionData.systemInstructions,
    solutionData.modelOutputStructure
  );

  // 4. Create data items and link them to the new solution
  const dataItemIds: string[] = [];
  for (const itemData of dataItemsData) {
    const dataItemId = `di-${Date.now()}-${Math.random()}`;
    statements.insertDataItem.run(
      dataItemId,
      solutionId,
      itemData.type,
      itemData.content_uri,
      itemData.guided_prompt,
      itemData.model_output ? JSON.stringify(itemData.model_output) : null
    );
    dataItemIds.push(dataItemId);
  }

  // 5. Return the created solution
  const newSolution = getSolutionById(solutionId);
  if (!newSolution) {
    throw new Error('Failed to create solution');
  }

  return newSolution;
}