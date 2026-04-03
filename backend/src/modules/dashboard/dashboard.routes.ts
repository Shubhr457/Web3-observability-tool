import { Router, Request, Response } from 'express';
import { ContractModel } from '../../models/contract.model';
import { EventModel } from '../../models/event.model';
import { TransactionModel } from '../../models/transaction.model';
import { AlertModel } from '../../models/alert.model';
import { getProvider } from '../../services/rpc.service';

const router = Router();

// GET /dashboard/stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const provider = getProvider();

    const [totalContracts, totalEvents, failedTx, totalAlerts, lastBlock] =
      await Promise.all([
        ContractModel.countDocuments(),
        EventModel.countDocuments(),
        TransactionModel.countDocuments({ status: 'failed' }),
        AlertModel.countDocuments(),
        provider
          ? Promise.race([
              provider.getBlockNumber(),
              new Promise<null>(r => setTimeout(() => r(null), 3000)),
            ]).catch(() => null)
          : null,
      ]);

    const [recentAlerts, recentEvents] = await Promise.all([
      AlertModel.find({}).sort({ createdAt: -1 }).limit(5),
      EventModel.find({}).sort({ timestamp: -1 }).limit(5),
    ]);

    return res.json({
      totalContracts,
      totalEvents,
      failedTx,
      totalAlerts,
      lastBlock,
      health: provider ? 'connected' : 'disconnected',
      recentAlerts,
      recentEvents,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
