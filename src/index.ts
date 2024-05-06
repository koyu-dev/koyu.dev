import express from 'express';
import { ParseServer } from 'parse-server';
import 'dotenv/config';
import ParseDashboard from 'parse-dashboard';
import firebaseAuthAdapter from 'parse-server-firebase-auth-adapter';
import cors from 'cors';
import http from 'http';
import formData from 'express-form-data';
import path from 'path';
import FSFilesAdapter from '@parse/fs-files-adapter';

const uploadDir = `${path.dirname(__dirname)}/tmp`;

const app = express();
app.use(cors());
app.use(formData.parse({
	uploadDir, autoClean: true
}));

import { Request, Response, NextFunction } from 'express';
import { ParsedQs } from 'qs';

interface RequestFile extends Request<{}, any, any, ParsedQs, Record<string, any>> {
	files: {
		[key: string]: uploadFileParams;
	}
}

interface FileData {
	base64: string;
	fileData: {
		metadata: any;
		tags: any;
	};
	_ContentType: string;
	_ApplicationId: string;
	_JavaScriptKey: string;
	_ClientVersion: string;
	_InstallationId: string;
	_SessionToken: string;
}

import config from '../config.json';
import { createProject, createProjectParams, deleteProject, getProject, uploadFileParams } from './project';

const filesAdapter = new FSFilesAdapter({
  encryptionKey: config.fileKey,
});

const params: any = {
  databaseURI: config.dbUri,
  cloud: config.cloud,
  appId: config.apps[0].appId,
  masterKey: config.apps[0].masterKey,
  fileKey: config.fileKey,
  serverURL: config.apps[0].serverURL,
	// publicServerURL: config.apps[0].serverURL,
	auth: {},
	liveQuery: {
    classNames: ['Post'],
		redisURL: config.redisUrl,
		logLevel: 'VERBOSE',
  },
	startLiveQueryServer: true,
	websocketTimeout: 10 * 1000,
  cacheTimeout: 60 * 600 * 1000,
  logLevel: 'VERBOSE',
	fileUpload: {
		enabled: true,
		enableForPublic: true,
	},
	filesAdapter,
	verbose: true,
	encodeParseObjectInCloudFunction: true,
};

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY && process.env.FIREBASE_DATABASE_URL) {
	if (!params.auth) {
		params.auth = {};
	}
	params.auth.firebase = firebaseAuthAdapter;
}

const server = new ParseServer(params);

const dashboard = new ParseDashboard(config);

// Parse.initialize(config.apps[0].appId, config.jsKey, config.apps[0].masterKey);

(async () => {
	await server.start();
	app.use(express.json())
	app.use(express.urlencoded({ extended: true }));
	if (process.env.NODE_ENV === 'development') {
		app.use('/dashboard', dashboard as any);
	}

	app.use('*', async (req: express.Request, res, next) => {
		if (req.headers['x-session-token'] !== null) {
			req.headers['x-parse-session-token'] = req.headers['x-session-token'];
			delete req.headers['x-session-token'];
		}
		if (!req.headers.referer?.match(/\/dashboard\//)) {
			req.headers['x-parse-application-id'] = config.apps[0].appId;
		}
		next();
	});

	// Create project
	app.post('/projects', async (req, res) => {
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
	app.delete('/projects/:projectId', async (req, res, next) => {
		try {
			const sessionToken = req.headers['x-parse-session-token'] as string;
			await deleteProject(sessionToken, req.params.projectId);
			res.send({});
		} catch (error) {
			res.status(400).send({ error: error.message });
		}
	});

	app.get('/projects/:projectId', async (req, res, next) => {
		try {
			const sessionToken = req.headers['x-parse-session-token'] as string;
			const project = await getProject(sessionToken, req.params.projectId);
			res.send(project.toParams());
		} catch (error) {
			res.status(400).send({ error: error.message });
		}
	});
	
	app.get('/files/:fileId', async (req, res, next) => {
		const { fileId } = req.params;
		try {
			const file = await filesAdapter.getFileData(fileId) as Buffer;
			const json = JSON.parse(file.toString()) as FileData;
			const buffer = Buffer.from(json.base64, 'base64');
			res.set('Content-Type', json._ContentType);
			res.send(buffer);
		} catch (error) {
			res.status(404).send({error: `File is not found.`});
		}
	});

	app.use('/', server.app);
	const httpServer = http.createServer(app);
  httpServer.listen(process.env.PORT, function () {
    console.log(`API server running on port ${process.env.PORT}.`);
  });
	await ParseServer.createLiveQueryServer(httpServer, {
		redisURL: config.redisUrl,
	});
})();
