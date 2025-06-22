'use server';

import { ensureInitialized, getStatements, rowToDataItem } from '@/lib/database';
import { DataItem } from '@/lib/data';

export interface DataItemResult {
  success: boolean;
  data?: DataItem[];
  error?: string;
}

export interface CreateDataItemResult {
  success: boolean;
  data?: DataItem;
  error?: string;
}

// Get all data items for a solution
export async function getDataItemsAction(solutionId: string): Promise<DataItemResult> {
  try {
    ensureInitialized();
    const statements = getStatements();
    
    const rows = statements.getDataItemsBySolutionId.all(solutionId);
    const dataItems = rows.map((row: any) => rowToDataItem(row));
    
    return {
      success: true,
      data: dataItems
    };
  } catch (error) {
    console.error('Error getting data items:', error);
    return {
      success: false,
      error: 'Failed to get training data'
    };
  }
}

// Create a new data item for training
export async function createDataItemAction(
  solutionId: string,
  type: DataItem['type'],
  content_uri: string,
  guided_prompt: string,
  model_output?: Record<string, any>
): Promise<CreateDataItemResult> {
  try {
    ensureInitialized();
    const statements = getStatements();
    
    const dataItemId = `data-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    statements.insertDataItem.run(
      dataItemId,
      solutionId,
      type,
      content_uri,
      guided_prompt,
      model_output ? JSON.stringify(model_output) : null
    );
    
    // Get the created data item
    const rows = statements.getDataItemsBySolutionId.all(solutionId);
    const dataItem = rows.find((row: any) => row.id === dataItemId);
    
    if (!dataItem) {
      throw new Error('Failed to retrieve created data item');
    }
    
    return {
      success: true,
      data: rowToDataItem(dataItem)
    };
  } catch (error) {
    console.error('Error creating data item:', error);
    return {
      success: false,
      error: 'Failed to create training data'
    };
  }
}

// Update data item model output
export async function updateDataItemAction(
  dataItemId: string,
  model_output: Record<string, any>
): Promise<CreateDataItemResult> {
  try {
    ensureInitialized();
    const statements = getStatements();
    
    statements.updateDataItemModelOutput.run(JSON.stringify(model_output), dataItemId);
    
    // Since we don't have a direct way to get a single data item, we'll need to work around this
    // For now, return success without the updated data
    return {
      success: true
    };
  } catch (error) {
    console.error('Error updating data item:', error);
    return {
      success: false,
      error: 'Failed to update training data'
    };
  }
}