import { Router, Request, Response } from 'express';
import { ContractModel } from '../../models/contract.model';
import { subscribeContract, unsubscribeContract } from '../../services/rpc.service';
import { invalidateCache } from '../../services/decoder.service';

const router = Router();

// POST /contracts
router.post('/', async (req: Request, res: Response) => {
  try {
    const { address, chain, abi, name } = req.body;
    if (!address || !chain) {
      return res.status(400).json({ error: 'address and chain are required' });
    }

    const contract = await ContractModel.create({
      address: address.toLowerCase(),
      chain,
      abi: abi ?? [],
      name,
    });

    subscribeContract(contract._id, contract.address, contract.abi);
    return res.status(201).json(contract);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Contract already exists on this chain' });
    }
    return res.status(500).json({ error: err.message });
  }
});

// GET /contracts
router.get('/', async (_req: Request, res: Response) => {
  try {
    const contracts = await ContractModel.find({}).sort({ createdAt: -1 });
    return res.json(contracts);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /contracts/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const contract = await ContractModel.findById(req.params.id);
    if (!contract) return res.status(404).json({ error: 'Not found' });
    return res.json(contract);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /contracts/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const contract = await ContractModel.findByIdAndDelete(req.params.id);
    if (!contract) return res.status(404).json({ error: 'Not found' });

    unsubscribeContract(contract.address);
    invalidateCache(contract._id.toString());
    return res.json({ deleted: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
