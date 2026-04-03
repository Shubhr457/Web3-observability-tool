import { Router, Request, Response } from 'express';
import { EventModel } from '../../models/event.model';

const router = Router();

// GET /events?contractId=&eventName=&page=1&limit=20
router.get('/', async (req: Request, res: Response) => {
  try {
    const { contractId, eventName, page = '1', limit = '20' } = req.query;

    const filter: Record<string, unknown> = {};
    if (contractId) filter.contractId = contractId;
    if (eventName)  filter.eventName  = eventName;

    const pageNum  = Math.max(1, parseInt(page  as string, 10));
    const limitNum = Math.min(100, parseInt(limit as string, 10));
    const skip     = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      EventModel.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limitNum),
      EventModel.countDocuments(filter),
    ]);

    return res.json({ data, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
