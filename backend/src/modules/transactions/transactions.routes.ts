import { Router, Request, Response } from 'express';
import { TransactionModel } from '../../models/transaction.model';

const router = Router();

// GET /transactions?contractId=&status=failed&page=1&limit=20
router.get('/', async (req: Request, res: Response) => {
  try {
    const { contractId, status, page = '1', limit = '20' } = req.query;

    const filter: Record<string, unknown> = {};
    if (contractId) filter.contractId = contractId;
    if (status)     filter.status     = status;

    const pageNum  = Math.max(1, parseInt(page  as string, 10));
    const limitNum = Math.min(100, parseInt(limit as string, 10));
    const skip     = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      TransactionModel.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limitNum),
      TransactionModel.countDocuments(filter),
    ]);

    return res.json({ data, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
