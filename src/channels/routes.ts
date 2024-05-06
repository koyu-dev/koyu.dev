import express from 'express';
const router = express.Router({mergeParams: true});

import { Request, Response, NextFunction } from 'express';

// Ceate channel
router.post('/', async (req, res) => {
	console.log(req.params);
	res.send({});
});

// Delete channel
router.delete('/:channelId', async (req, res, next) => {
	res.send({});
});

// Update channel
router.put('/:channelId', async (req, res, next) => {
	res.send({});
});

// Get all channels
router.get('/', async (req, res, next) => {
	console.log(req.params);
	res.send({});
});

// Get channel
router.get('/:channelId', async (req, res, next) => {
	console.log(req.params);
	res.send({});
});

export default router;
