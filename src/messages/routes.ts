import express from 'express';
const router = express.Router({mergeParams: true});

import { Request, Response, NextFunction } from 'express';

// Ceate message
router.post('/', async (req, res) => {
	console.log(req.params);
	res.send({});
});

// Delete message
router.delete('/:messageId', async (req, res, next) => {
	res.send({});
});

// Update message
router.put('/:messageId', async (req, res, next) => {
	res.send({});
});

// Get all messages
router.get('/', async (req, res, next) => {
	console.log(req.params);
	res.send({});
});

// Get message
router.get('/:messageId', async (req, res, next) => {
	console.log(req.params);
	res.send({});
});

export default router;
