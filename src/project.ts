import Parse, { User } from "parse/node";
import { generateAcl } from "./acl";
import config from "../config.json";
import fs from "fs";

Parse.initialize(config.apps[0].appId, config.jsKey, config.apps[0].masterKey);
Parse.serverURL = config.apps[0].serverURL;

export class Project extends Parse.Object {
	constructor() {
    super('Project');
  }

	toParams(): {[key: string]: any} {
		const params: {[key: string]: any} = {};
		for (const key in this.toJSON()) {
			if (['ACL', 'objectId'].includes(key)) {
				continue;
			}
			if (key === 'owner') {
				const owner = this.get(key) as Parse.User;
				const p: {[key: string]: any} = {};
				for (const key in owner.toJSON()) {
					if (['ACL', 'objectId', '__type', 'className', 'sessionToken'].includes(key)) {
						continue;
					}
					p[key] = owner.get(key);
				}
				params[key] = p;
				continue;
			}
			if (key === 'icon') {
				const file = this.get(key) as Parse.File;
				const p: {[key: string]: any} = {};
				const fileJson = file.toJSON();
				for (const key in fileJson) {
					if (['__type'].includes(key)) {
						continue;
					}
					p[key] = fileJson[key];
					if (key === 'url') {
						p.url = fileJson[key].replace(`${config.apps[0].appId}/`, '');
					}
				}
				params[key] = p;
				continue;
			}
			params[key] = this.get(key);
		}
		return params;
	}
}

Parse.Object.registerSubclass('Project', Project);

export interface createProjectParams {
	name: string;
	image?: uploadFileParams;
}

export interface uploadFileParams {
	fieldName: string;
	originalFilename: string;
	path: string;
	headers: {
		'content-disposition': string;
		'content-type': string;
	};
	size: number;
	name: string;
	type: string;
}

export const createProject = async (sessionToken: string, params: createProjectParams): Promise<Project> => {
	Parse.User.enableUnsafeCurrentUser();
	if (!sessionToken === undefined || sessionToken.trim() === '') {
		throw new Error('Invalid session token');
	}
	await Parse.User.become(sessionToken);
	const user = Parse.User.current() as User;
	const { name, image } = params;
	const query = new Parse.Query('Project');
	query.equalTo('name', name.toLocaleLowerCase());
	const res = await query.first({ useMasterKey: true });
	if (res) {
		throw new Error('Project already exists');
	}
	const project = new (Parse.Object.extend('Project')) as Project;
	project.set('name', name.toLocaleLowerCase());
	project.set('owner', user);
	if (image) {
		const data = fs.readFileSync(image.path);
		const file = new Parse.File(image.name, Array.from(new Uint8Array(data.buffer)), image.type);
		project.set('icon', file);
	}
	// Set acl
	const acl = generateAcl(name, user);
	project.setACL(acl);
	await project.save(null, {sessionToken});
	// Generate default token
	const token = new (Parse.Object.extend('Token')) as Parse.Object;
	token.set('project', project);
	token.set('name', 'default');
	token.set('readonly', false);
	token.set('token', crypto.randomUUID());
	token.setACL(acl);
	await token.save(null, {sessionToken});
	return project;
};

export const createProjectParams = {
	requireUser: true,
	fields: {
		name: {
			type: String,
			required: true,
			options: (name: string) => name.match(/^[a-z0-9_]{3,20}$/),
			error: 'Invalid project name format [a-z0-9_]{3,20}',
		}
	}
};

export const getProject = async (sessionToken: string, name: string): Promise<Project> => {
	if (!sessionToken === undefined || sessionToken.trim() === '') {
		throw new Error('Invalid session token');
	}
	const query = new Parse.Query('Project');
	// Find if the project already exists by domain
	query.equalTo('name', name.toLocaleLowerCase());
	query.include('owner');
	const project = await query.first({sessionToken}) as Project;
	if (!project) {
		throw new Error('Project is not found.');
	}
	return project;
};

export const deleteProject = async (sessionToken: string, name: string): Promise<void> => {
	const project = await getProject(sessionToken, name);
	try {
		const icon = project.get('icon') as Parse.File;
		await project.destroy({sessionToken});
		if (icon) {
			await icon.destroy();
		}
	} catch (error) {
		throw new Error('Error deleting project. Please check your permissions.');
	}
	const queryToken = new Parse.Query('Token');
	queryToken.equalTo('project', project);
	const tokens = await queryToken.findAll({sessionToken});
	try {
		await Parse.Object.destroyAll(tokens, {sessionToken});
	} catch (error) {
		throw new Error('Error deleting tokens. Please check your permissions.');
	}
};
