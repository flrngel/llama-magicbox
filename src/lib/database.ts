import Database from 'better-sqlite3';
import path from 'path';
import { User, Solution, DataItem, Rating } from './data';

// Database file path
const dbPath = path.join(process.cwd(), 'magicbox.db');

// Lazy initialization
let db: Database.Database | null = null;
let statements: any = null;
let isInitialized = false;

function getDatabase() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
  }
  return db;
}

// Create tables if they don't exist and handle migrations
function createTables() {
  const database = getDatabase();
  
  // Check if we need to migrate existing tables
  const tableInfo = database.pragma("table_info(solutions)");
  const hasStatusColumn = (tableInfo as any[]).some((col: any) => col.name === 'status');
  
  // Users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Solutions table - handle both new table creation and migration
  if (!hasStatusColumn) {
    // If table exists but doesn't have status column, we need to migrate
    const existingTables = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='solutions'").all();
    
    if (existingTables.length > 0) {
      console.log('Migrating existing solutions table to add status column...');
      
      // Add the status column with default value
      database.exec(`ALTER TABLE solutions ADD COLUMN status TEXT NOT NULL DEFAULT 'published'`);
      
      // Make other fields nullable for draft support
      database.exec(`
        CREATE TABLE solutions_new (
          id TEXT PRIMARY KEY,
          slug TEXT UNIQUE,
          name TEXT,
          description TEXT,
          problem_description TEXT,
          target_users TEXT,
          creator_id TEXT NOT NULL,
          usage_count INTEGER DEFAULT 0,
          rating REAL DEFAULT 0,
          category TEXT CHECK (category IN ('Tax & Finance', 'Medical & Insurance', 'Rental & Legal', 'Personal Organization')),
          system_instructions TEXT,
          model_output_structure TEXT,
          status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (creator_id) REFERENCES users (id)
        );
      `);
      
      // Copy existing data
      database.exec(`
        INSERT INTO solutions_new 
        SELECT id, slug, name, description, problem_description, target_users, 
               creator_id, usage_count, rating, category, 
               system_instructions, model_output_structure, status,
               created_at, updated_at 
        FROM solutions;
      `);
      
      // Drop old table and rename new one
      database.exec(`DROP TABLE solutions;`);
      database.exec(`ALTER TABLE solutions_new RENAME TO solutions;`);
      
      console.log('Migration completed successfully!');
    } else {
      // Create new table
      database.exec(`
        CREATE TABLE solutions (
          id TEXT PRIMARY KEY,
          slug TEXT UNIQUE,
          name TEXT,
          description TEXT,
          problem_description TEXT,
          target_users TEXT,
          creator_id TEXT NOT NULL,
          usage_count INTEGER DEFAULT 0,
          rating REAL DEFAULT 0,
          category TEXT CHECK (category IN ('Tax & Finance', 'Medical & Insurance', 'Rental & Legal', 'Personal Organization')),
          system_instructions TEXT,
          model_output_structure TEXT,
          status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (creator_id) REFERENCES users (id)
        );
      `);
    }
  } else {
    // Table already has status column, just ensure it exists
    database.exec(`
      CREATE TABLE IF NOT EXISTS solutions (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE,
        name TEXT,
        description TEXT,
        problem_description TEXT,
        target_users TEXT,
        creator_id TEXT NOT NULL,
        creator TEXT,
        usage_count INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        category TEXT CHECK (category IN ('Tax & Finance', 'Medical & Insurance', 'Rental & Legal', 'Personal Organization')),
        system_instructions TEXT,
        model_output_structure TEXT,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES users (id)
      );
    `);
  }

  // Check if we need to remove creator column
  const currentTableInfo = database.pragma("table_info(solutions)");
  const hasCreatorColumn = (currentTableInfo as any[]).some((col: any) => col.name === 'creator');
  
  if (hasCreatorColumn) {
    console.log('Migrating solutions table to remove creator column...');
    
    // Create new table without creator column
    database.exec(`
      CREATE TABLE solutions_new (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE,
        name TEXT,
        description TEXT,
        problem_description TEXT,
        target_users TEXT,
        creator_id TEXT NOT NULL,
        usage_count INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        category TEXT CHECK (category IN ('Tax & Finance', 'Medical & Insurance', 'Rental & Legal', 'Personal Organization')),
        system_instructions TEXT,
        model_output_structure TEXT,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES users (id)
      );
    `);
    
    // Copy data (excluding creator column)
    database.exec(`
      INSERT INTO solutions_new 
      SELECT id, slug, name, description, problem_description, target_users, 
             creator_id, usage_count, rating, category, 
             system_instructions, model_output_structure, status,
             created_at, updated_at 
      FROM solutions;
    `);
    
    // Drop old table and rename new one
    database.exec(`DROP TABLE solutions;`);
    database.exec(`ALTER TABLE solutions_new RENAME TO solutions;`);
    
    console.log('Migration completed - creator column removed!');
  }

  // Data items table
  database.exec(`
    CREATE TABLE IF NOT EXISTS data_items (
      id TEXT PRIMARY KEY,
      solution_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('image', 'pdf', 'text', 'csv', 'document', 'audio', 'archive', 'email', 'other')),
      content_uri TEXT NOT NULL,
      guided_prompt TEXT NOT NULL,
      model_output TEXT, -- JSON string
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (solution_id) REFERENCES solutions (id) ON DELETE CASCADE
    );
  `);

  // Ratings table
  database.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      solution_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (solution_id) REFERENCES solutions (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(solution_id, user_id) -- One rating per user per solution
    );
  `);

  // Create indexes for better performance
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_solutions_creator_id ON solutions(creator_id);
    CREATE INDEX IF NOT EXISTS idx_solutions_category ON solutions(category);
    CREATE INDEX IF NOT EXISTS idx_solutions_slug ON solutions(slug);
    CREATE INDEX IF NOT EXISTS idx_solutions_status ON solutions(status);
    CREATE INDEX IF NOT EXISTS idx_data_items_solution_id ON data_items(solution_id);
    CREATE INDEX IF NOT EXISTS idx_ratings_solution_id ON ratings(solution_id);
    CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
  `);
}

// Prepared statements for better performance
function getStatements() {
  if (!statements) {
    const database = getDatabase();
    statements = {
      // Users
      insertUser: database.prepare(`
        INSERT INTO users (id, name, email, avatar)
        VALUES (?, ?, ?, ?)
      `),
      getUserById: database.prepare('SELECT * FROM users WHERE id = ?'),
      getUserByEmail: database.prepare('SELECT * FROM users WHERE email = ?'),

      // Solutions
      insertSolution: database.prepare(`
        INSERT INTO solutions (
          id, slug, name, description, problem_description, target_users,
          creator_id, usage_count, rating, category,
          system_instructions, model_output_structure, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      insertDraftSolution: database.prepare(`
        INSERT INTO solutions (id, creator_id, status) VALUES (?, ?, 'draft')
      `),
      getAllSolutions: database.prepare(`
        SELECT s.*, u.name as creator_name 
        FROM solutions s
        LEFT JOIN users u ON s.creator_id = u.id
        WHERE s.status = 'published' 
        ORDER BY s.created_at DESC
      `),
      getDraftSolutionsByCreator: database.prepare(`
        SELECT s.*, u.name as creator_name 
        FROM solutions s
        LEFT JOIN users u ON s.creator_id = u.id
        WHERE s.creator_id = ? AND s.status = 'draft' 
        ORDER BY s.updated_at DESC
      `),
      getSolutionsByCreator: database.prepare(`
        SELECT s.*, u.name as creator_name 
        FROM solutions s
        LEFT JOIN users u ON s.creator_id = u.id
        WHERE s.creator_id = ? 
        ORDER BY s.updated_at DESC
      `),
      getSolutionById: database.prepare(`
        SELECT s.*, u.name as creator_name 
        FROM solutions s
        LEFT JOIN users u ON s.creator_id = u.id
        WHERE s.id = ?
      `),
      getSolutionBySlug: database.prepare(`
        SELECT s.*, u.name as creator_name 
        FROM solutions s
        LEFT JOIN users u ON s.creator_id = u.id
        WHERE s.slug = ?
      `),
      updateSolution: database.prepare(`
        UPDATE solutions SET 
          name = ?, description = ?, problem_description = ?, target_users = ?,
          system_instructions = ?, model_output_structure = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `),
      updateSolutionStatus: database.prepare(`
        UPDATE solutions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `),
      publishSolution: database.prepare(`
        UPDATE solutions SET 
          status = 'published', slug = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `),
      incrementUsageCount: database.prepare(`
        UPDATE solutions SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `),

      // Data items
      insertDataItem: database.prepare(`
        INSERT INTO data_items (id, solution_id, type, content_uri, guided_prompt, model_output)
        VALUES (?, ?, ?, ?, ?, ?)
      `),
      getDataItemsBySolutionId: database.prepare('SELECT * FROM data_items WHERE solution_id = ?'),
      updateDataItemModelOutput: database.prepare(`
        UPDATE data_items SET model_output = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `),

      // Ratings
      insertRating: database.prepare(`
        INSERT OR REPLACE INTO ratings (id, solution_id, user_id, rating, comment)
        VALUES (?, ?, ?, ?, ?)
      `),
      getRatingsBySolutionId: database.prepare('SELECT * FROM ratings WHERE solution_id = ?'),
      getRatingByUserAndSolution: database.prepare('SELECT * FROM ratings WHERE user_id = ? AND solution_id = ?'),
      updateSolutionRating: database.prepare(`
        UPDATE solutions SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `),
    };
  }
  return statements;
}

// Helper functions to convert between database rows and TypeScript objects
export function rowToSolution(row: any): Solution {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    problemDescription: row.problem_description,
    targetUsers: row.target_users,
    creatorId: row.creator_id,
    creator: row.creator_name || 'Unknown creator',
    usageCount: row.usage_count,
    rating: row.rating,
    category: row.category,
    trainingDataItems: [], // Will be populated separately
    systemInstructions: row.system_instructions,
    modelOutputStructure: row.model_output_structure,
    status: row.status || 'published', // Default for backwards compatibility
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToDataItem(row: any): DataItem {
  return {
    id: row.id,
    solutionId: row.solution_id,
    type: row.type,
    content_uri: row.content_uri,
    guided_prompt: row.guided_prompt,
    model_output: row.model_output ? JSON.parse(row.model_output) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar,
  };
}

function rowToRating(row: any): Rating {
  return {
    id: row.id,
    solutionId: row.solution_id,
    userId: row.user_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Initialize database
function initializeDatabase() {
  createTables();
  seedDefaultData();
}

// Seed with default data if tables are empty
function seedDefaultData() {
  const database = getDatabase();
  const stmts = getStatements();
  const solutionCount = database.prepare('SELECT COUNT(*) as count FROM solutions').get() as { count: number };
  
  if (solutionCount.count === 0) {
    console.log('Seeding database with default data...');
    
    // Create default users
    const defaultUsers = [
      { id: 'user-42', name: 'CleverPanda42', email: 'cleverpanda42@example.com', avatar: null },
      { id: 'user-91', name: 'AgileEagle91', email: 'agileeagle91@example.com', avatar: null },
    ];

    for (const user of defaultUsers) {
      try {
        stmts.insertUser.run(user.id, user.name, user.email, user.avatar);
      } catch (error: any) {
        if (error.message.includes('UNIQUE constraint failed')) {
          console.log(`User ${user.email} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    // Create default solutions
    const defaultSolutions = [
      {
        id: "1",
        slug: "tax-receipt-organizer",
        name: "Tax Receipt Organizer",
        description: "Categorize business receipts for tax filing.",
        problemDescription: "This solution automatically extracts key information from your receipts, like vendor, date, and amount, and categorizes them for easy tax filing.",
        targetUsers: "Small business owners, freelancers, accountants",
        creatorId: "user-42",
        usageCount: 47,
        rating: 4.5,
        category: "Tax & Finance" as const,
        systemInstructions: `You are an expert accountant. Extract vendor, date, and total amount from the receipt. Use the user's guided prompts to determine the expense category. Output valid JSON that adheres to the provided schema.`,
        modelOutputStructure: `z.object({ expenseCategory: z.string(), date: z.string(), vendor: z.string(), amount: z.number() })`,
      },
      {
        id: "3",
        slug: "rental-application-extractor",
        name: "Rental Application Extractor",
        description: "Extract applicant info from rental forms.",
        problemDescription: "Quickly pull applicant names, contact info, and employment history from various rental application formats into a structured summary.",
        targetUsers: "Landlords, property managers",
        creatorId: "user-91",
        usageCount: 89,
        rating: 4.2,
        category: "Rental & Legal" as const,
        systemInstructions: `You are an expert at extracting data from rental applications. Extract the applicant's full name, contact information (phone and email), employment history, and references. Output valid JSON.`,
        modelOutputStructure: `z.object({ applicantName: z.string(), contactInformation: z.object({ phone: z.string(), email: z.string() }), employmentHistory: z.array(z.object({ employer: z.string(), position: z.string(), startDate: z.string(), endDate: z.string().optional() })), references: z.array(z.object({ name: z.string(), relationship: z.string(), contact: z.string() })) })`,
      },
    ];

    for (const solution of defaultSolutions) {
      stmts.insertSolution.run(
        solution.id,
        solution.slug,
        solution.name,
        solution.description,
        solution.problemDescription,
        solution.targetUsers,
        solution.creatorId,
        solution.usageCount,
        solution.rating,
        solution.category,
        solution.systemInstructions,
        solution.modelOutputStructure,
        'published' // Default status for seed data
      );
    }

    // Create default data items
    const defaultDataItems = [
      {
        id: "data-item-1",
        solutionId: "1",
        type: 'image' as const,
        content_uri: 'placeholder/receipt-bistro.jpg',
        guided_prompt: 'This is a meal expense.',
        model_output: {
          expenseCategory: "Meals & Entertainment",
          date: "2023-10-26",
          vendor: "The Corner Bistro",
          amount: 45.50
        },
      },
      {
        id: "data-item-2",
        solutionId: "1",
        type: 'image' as const,
        content_uri: 'placeholder/receipt-office-supplies.png',
        guided_prompt: 'This is for office supplies.',
        model_output: {
          expenseCategory: "Office Supplies",
          date: "2023-10-28",
          vendor: "Staples",
          amount: 112.30
        },
      }
    ];

    for (const dataItem of defaultDataItems) {
      stmts.insertDataItem.run(
        dataItem.id,
        dataItem.solutionId,
        dataItem.type,
        dataItem.content_uri,
        dataItem.guided_prompt,
        JSON.stringify(dataItem.model_output)
      );
    }

    console.log('Database seeded successfully!');
  }
}

// Ensure database is initialized (call this from API routes)
function ensureInitialized() {
  if (!isInitialized) {
    initializeDatabase();
    isInitialized = true;
  }
}

export { getDatabase, getStatements, rowToSolution, rowToDataItem, rowToUser, rowToRating, initializeDatabase, ensureInitialized };