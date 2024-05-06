import Parse, { User } from "parse/node";
import { generateAcl } from "../acl";
import config from "../../config.json";
import fs from "fs";
import { getProjectsQuery } from "./routes";

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

export interface updateProjectParams {
	name: string;
	image?: uploadFileParams;
	projectId: string;
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
	if (!sessionToken || sessionToken.trim() === '') {
		throw new Error('Invalid session token');
	}
	await Parse.User.become(sessionToken);
	const user = Parse.User.current() as User;
	const { name, image } = params;
	const query = new Parse.Query('Project');
	query.equalTo('slug', name.toLocaleLowerCase());
	const res = await query.first({ useMasterKey: true });
	if (res) {
		throw new Error('Project already exists');
	}
	const project = new (Parse.Object.extend('Project')) as Project;
	project.set('name', name);
	project.set('slug', name.toLocaleLowerCase());
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

export const updateProject = async (sessionToken: string, params: updateProjectParams): Promise<Project> => {
	if (!sessionToken || sessionToken.trim() === '') {
		throw new Error('Invalid session token');
	}
	const { name, image, projectId } = params;
	const query = new Parse.Query('Project');
	query.equalTo('slug', projectId.toLocaleLowerCase());
	query.include('owner');
	const project = await query.first({ sessionToken }) as Project;
	if (!project) {
		throw new Error('Project is not found.');
	}
	project.set('name', name);
	project.set('slug', name.toLocaleLowerCase());
	if (image) {
		// Delete old icon
		const icon = project.get('icon') as Parse.File;
		if (icon) {
			await icon.destroy();
		}
		const data = fs.readFileSync(image.path);
		const file = new Parse.File(image.name, Array.from(new Uint8Array(data.buffer)), image.type);
		project.set('icon', file);
	}
	await project.save(null, {sessionToken});
	return project;
};

export const findProjects = async (sessionToken: string, params: getProjectsQuery, publicProject: boolean = true): Promise<Project[]> => {
	const query = new Parse.Query('Project');
	query.include('owner');
	const orders = (params.order || 'createdAt').split(',');
	const limit = parseInt(params.limit || '10');
	const page = parseInt(params.page || '1');
	query.limit(limit);
	query.skip((page - 1) * limit);
	orders.forEach(order => {
		if (order.startsWith('-')) {
			query.addDescending(order.slice(1));
		} else {
			query.addAscending(order);
		}
	});
	if (!publicProject && (!sessionToken || sessionToken.trim() === '')) {
		throw new Error('Invalid session token');
	}
	const options = publicProject ? { useMasterKey: true } : { sessionToken };
	const projects = await query.find(options) as Project[];
	return projects;
};

export const getProject = async (sessionToken: string, name: string, publicProject: boolean = true): Promise<Project> => {
	const query = new Parse.Query('Project');
	query.equalTo('slug', name.toLocaleLowerCase());
	query.include('owner');
	if (!publicProject && (!sessionToken || sessionToken.trim() === '')) {
		throw new Error('Invalid session token');
	}
	const options = publicProject ? { useMasterKey: true } : { sessionToken };
	const project = await query.first(options) as Project;
	if (!project) {
		throw new Error('Project is not found.');
	}
	return project;
};

export const deleteProject = async (sessionToken: string, name: string): Promise<void> => {
	const project = await getProject(sessionToken, name, false);
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
