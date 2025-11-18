import { db } from '@/lib/client';
import { testFlowsTable, type TestFlowEntity } from '@/db/testFlow.db';
import { generateId, type Id } from '@/types';
import { eq, inArray } from 'drizzle-orm';

export abstract class TestFlowService {
  /**
   * Get all test flows
   */
  static async getAll(): Promise<TestFlowEntity[]> {
    return await db.select().from(testFlowsTable);
  }

  /**
   * Get test flow by ID
   */
  static async getById(id: Id<'testFlow'>): Promise<TestFlowEntity | null> {
    const [flow] = await db
      .select()
      .from(testFlowsTable)
      .where(eq(testFlowsTable.id, id));

    return flow || null;
  }

  /**
   * Get multiple test flows by IDs
   */
  static async getByIds(ids: Id<'testFlow'>[]): Promise<TestFlowEntity[]> {
    if (ids.length === 0) return [];

    return await db
      .select()
      .from(testFlowsTable)
      .where(inArray(testFlowsTable.id, ids));
  }

  /**
   * Create test flow
   */
  static async create(
    data: Omit<TestFlowEntity, 'id' | 'createdAt'>
  ): Promise<TestFlowEntity> {
    const flow: TestFlowEntity = {
      id: generateId('testFlow'),
      createdAt: new Date().toISOString(),
      ...data,
    };

    await db.insert(testFlowsTable).values(flow);
    return flow;
  }

  /**
   * Delete test flow
   */
  static async delete(id: Id<'testFlow'>): Promise<void> {
    await db.delete(testFlowsTable).where(eq(testFlowsTable.id, id));
  }
}
