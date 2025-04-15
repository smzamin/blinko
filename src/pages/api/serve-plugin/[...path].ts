import { createReadStream } from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import { join } from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query;
  const pathArray = Array.isArray(path) ? path : [path || ''].filter(Boolean);
  const filePath = join('.blinko', 'plugins', ...pathArray);

  try {
    const stream = createReadStream(filePath);
    res.setHeader('Content-Type', 'application/javascript');
    stream.pipe(res);
  } catch (error) {
    res.status(404).json({ error: 'Plugin not found' });
  }
}