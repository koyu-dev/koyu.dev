import axios, { AxiosError } from 'axios';
import config from '../config.json';
import { ProjectJson } from './project.test';
const baseUrl = config.apps[0].serverURL;

describe("Project", () => {
	let sessionToken: string;
	const username = 'test';
	const password = 'test';
	let projectId: string;
	beforeAll(async () => {
		try {
			await axios.post(`${baseUrl}users`, { username,	password });
		} catch (error) {
		}
		const res = await axios.post(`${baseUrl}login`, { username, password });
		sessionToken = res.data.sessionToken;
		// Create project
		const name = 'test';
		const projectResponse = await axios.post(`${baseUrl}projects`, { name }, {
			headers: {
				'X-Session-Token': sessionToken,
			},
		});
		const projectJson = projectResponse.data as ProjectJson;
		projectId = projectJson.objectId;
	});

	test('Successful create category', async () => {
		const name = 'test';
		const res = await axios.post(`${baseUrl}/projects/${projectId}/channels`, { name }, {
			headers: {
				'X-Session-Token': sessionToken,
			},
		});
		/*
		const categoryJson = res.data as ProjectJson;
		expect(categoryJson.name).toBe(name);
		*/
	});

	afterAll(async () => {
		// Delete project
		await axios.delete(`${baseUrl}projects/${projectId}`, {
			headers: {
				'X-Session-Token': sessionToken,
			},
		});
	});
});
