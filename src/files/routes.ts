import express from 'express';
const router = express.Router();
import FSFilesAdapter from '@parse/fs-files-adapter';
const filesAdapter = new FSFilesAdapter({
  // encryptionKey: config.fileKey,
});

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

router.get('/:fileId', async (req, res, next) => {
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

export default router;
