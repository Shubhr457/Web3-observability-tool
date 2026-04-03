import { Router, Request, Response } from 'express';
import { AlertModel } from '../../models/alert.model';

const router = Router();

// GET /alerts?contractId=&type=&severity=&page=1&limit=20
router.get('/', async (req: Request, res: Response) => {
  try {
    const { contractId, type, severity, page = '1', limit = '20' } = req.query;

    const filter: Record<string, unknown> = {};
    if (contractId) filter.contractId = contractId;
    if (type)       filter.type       = type;
    if (severity)   filter.severity   = severity;

    const pageNum  = Math.max(1, parseInt(page  as string, 10));
    const limitNum = Math.min(100, parseInt(limit as string, 10));
    const skip     = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      AlertModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      AlertModel.countDocuments(filter),
    ]);

    return res.json({ data, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
