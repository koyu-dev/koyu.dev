import Parse, { User } from "parse/node";
import { generateAcl } from "./acl";
import config from "../config.json";

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
			params[key] = this.get(key);
		}
		return params;
	}
}

Parse.Object.registerSubclass('Project', Project);

export const createProject = async (sessionToken: string, name: string): Promise<Project> => {
	Parse.User.enableUnsafeCurrentUser();
	if (!sessionToken === undefined || sessionToken.trim() === '') {
		throw new Error('Invalid session token');
	}
	await Parse.User.become(sessionToken);
	const user = Parse.User.current() as User;
	const query = new Parse.Query('Project');
	query.equalTo('name', name);
	const res = await query.first({ useMasterKey: true });
	if (res) {
		throw new Error('Project already exists');
	}
	const project = new (Parse.Object.extend('Project')) as Project;
	project.set('name', name.toLocaleLowerCase());
	project.set('owner', user);
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
		await project.destroy({sessionToken});
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
