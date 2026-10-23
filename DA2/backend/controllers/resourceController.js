import { RESOURCES } from '../models/resourceRegistry.js';
import {
  listResources,
  findResource,
  createResource,
  updateResource,
  deleteResource,
} from '../services/resourceService.js';
import { asyncHandler } from '../utils/http.js';

const spec = (key) => RESOURCES[key];

export const resourceHandlers = {
  list: (key) =>
    asyncHandler(async (req, res) => {
      res.json({ success: true, data: await listResources(spec(key)) });
    }),

  get: (key) =>
    asyncHandler(async (req, res) => {
      res.json({ success: true, data: await findResource(spec(key), req.params.id) });
    }),

  create: (key) =>
    asyncHandler(async (req, res) => {
      res.status(201).json({ success: true, data: await createResource(spec(key), req.body) });
    }),

  replace: (key) =>
    asyncHandler(async (req, res) => {
      res.json({ success: true, data: await updateResource(spec(key), req.params.id, req.body) });
    }),

  remove: (key) =>
    asyncHandler(async (req, res) => {
      const force = req.query.force === 'true';
      const label = spec(key).label;
      res.json({
        success: true,
        data: await deleteResource(spec(key), req.params.id, { force }),
        message: `${label} ${req.params.id} deleted.`,
      });
    }),
};
