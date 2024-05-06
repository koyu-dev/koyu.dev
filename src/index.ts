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

import projectRouter from './projects/routes';
import fileRouter from './files/routes';
import channelRouter from './channels/routes';
import messageRouter from './messages/routes';

const uploadDir = `${path.dirname(__dirname)}/tmp`;

const app = express();
app.use(cors());
app.use(formData.parse({
	uploadDir, autoClean: true
}));

import config from '../config.json';

const filesAdapter = new FSFilesAdapter({
  // encryptionKey: config.fileKey,
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

	app.use('/projects', projectRouter);
	app.use('/projects/:projectId/channels', channelRouter);
	app.use('/projects/:projectId/channels/:channelId/messages', messageRouter);
	app.use('/files', fileRouter);
	
	app.use('/', server.app);
	const httpServer = http.createServer(app);
  httpServer.listen(process.env.PORT, function () {
    console.log(`API server running on port ${process.env.PORT}.`);
  });
	await ParseServer.createLiveQueryServer(httpServer, {
		redisURL: config.redisUrl,
	});
})();
