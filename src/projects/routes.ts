import express from 'express';
const router = express.Router();

import { Request, Response, NextFunction } from 'express';
import { ParsedQs } from 'qs';
import {
	createProject,
	createProjectParams,
	deleteProject,
	findProjects,
	getProject,
	updateProject,
	updateProjectParams,
	uploadFileParams
} from './actions';

interface RequestFile extends Request<{}, any, any, ParsedQs, Record<string, any>> {
	files: {
		[key: string]: uploadFileParams;
	}
}

// Get projects
export interface getProjectsQuery {
	page: string;
	limit: string;
	order: string;
}

router.get('/', async (req, res) => {
	try {
		const sessionToken = req.headers['x-parse-session-token'] as string;
		const { page, limit, order } = req.query as unknown as getProjectsQuery;
		const projects = await findProjects(sessionToken, { page, limit, order });
		res.send(projects.map(p => p.toParams()));
	} catch (error) {
		res.status(400).send({ error: error.message });
	}
});

router.get('/my', async (req, res) => {
	try {
		const sessionToken = req.headers['x-parse-session-token'] as string;
		const { page, limit, order } = req.query as unknown as getProjectsQuery;
		const projects = await findProjects(sessionToken, { page, limit, order }, false);
		res.send(projects.map(p => p.toParams()));
	} catch (error) {
		res.status(400).send({ error: error.message });
	}
});

// Create project
router.post('/', async (req, res) => {
	try {
		const { files } = (req as unknown as RequestFile);
		const image = files.image;
		const sessionToken = req.headers['x-parse-session-token'] as string;
		const name = req.body.name;
		const params: createProjectParams = { name, image };
		const project = await createProject(sessionToken, params);
		res.send(project.toParams());
	} catch (error) {
		res.status(400).send({ error: error.message });
	}
});

// Delete project
router.delete('/:projectId', async (req, res, next) => {
	try {
		const sessionToken = req.headers['x-parse-session-token'] as string;
		await deleteProject(sessionToken, req.params.projectId);
		res.send({});
	} catch (error) {
		res.status(400).send({ error: error.message });
	}
});

// Update project
router.put('/:projectId', async (req, res, next) => {
	try {
		const { files } = (req as unknown as RequestFile);
		const image = files.image;
		const sessionToken = req.headers['x-parse-session-token'] as string;
		const name = req.body.name;
		const params: updateProjectParams = {
			name,
			image,
			projectId: req.params.projectId,
		};
		const project = await updateProject(sessionToken, params);
		res.send(project.toParams());
	} catch (error) {
		res.status(400).send({ error: error.message });
	}
});

router.get('/:projectId', async (req, res, next) => {
	try {
		const sessionToken = req.headers['x-parse-session-token'] as string;
		const project = await getProject(sessionToken, req.params.projectId);
		res.send(project.toParams());
	} catch (error) {
		res.status(400).send({ error: error.message });
	}
});

export default router;
