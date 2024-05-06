import axios, { AxiosError } from 'axios';
import config from '../config.json';
import fs from 'fs';
import FormData from 'form-data';
const baseUrl = config.apps[0].serverURL;

export interface ProjectJson {
  name: string
	slug: string
  owner: User
  ACL: Acl
  createdAt: string
  updatedAt: string
  objectId: string
	icon?: {
		__type: string
		name: string
		url: string
	}
}

export interface User {
  username: string
  createdAt: string
  updatedAt: string
  ACL: Acl
  sessionToken: string
  objectId: string
  __type: string
  className: string
}

export interface Acl {
	[key: string]: {
		read: boolean
		write: boolean
	}
}

export interface ErrorMessage {
	error: string
}

describe("Project", () => {
	let sessionToken: string;
	const username = 'test';
	const password = 'test';
	beforeAll(async () => {
		try {
			await axios.post(`${baseUrl}users`, { username,	password });
		} catch (error) {
		}
		const res = await axios.post(`${baseUrl}login`, { username, password });
		sessionToken = res.data.sessionToken;
	});

	test('Successful create project', async () => {
		try {
			const name = 'test';
			const res = await axios.post(`${baseUrl}projects`, { name }, {
				headers: {
					'X-Session-Token': sessionToken,
				},
			});
			const projectJson = res.data as ProjectJson;
			expect(projectJson.name).toBe('test');
			expect(projectJson.owner.username).toBe(username);
			expect(projectJson.createdAt).toBeDefined();
			expect(projectJson.updatedAt).toBeDefined();
			const deleteUrl = `${baseUrl}projects/${name}`;
			await axios.delete(deleteUrl, {
				headers: {
					'X-Session-Token': sessionToken,
				},
			});
			expect(true).toBe(true);
		} catch (error) {
			console.log(error);
			expect(true).toBe(false);
		}
	});

	test('Failed create project', async () => {
		const name = 'test';
		try {
			await axios.post(`${baseUrl}projects`, { name }, {
				headers: {
					'X-Session-Token': sessionToken,
				},
			});
			expect(true).toBe(true);
			await axios.post(`${baseUrl}projects`, { name }, {
				headers: {
					'X-Session-Token': sessionToken,
				},
			});
			expect(true).toBe(false);
		} catch (error) {
			const message = (error as AxiosError).response?.data as ErrorMessage;
			expect(message.error).toBe('Project already exists');
		}
		try {
			await axios.delete(`${baseUrl}projects/${name}`, {
				headers: {
					'X-Session-Token': sessionToken,
				},
			});
			expect(true).toBe(true);
		} catch (error) {
			console.log(error);
		}
	});

	test('get project', async () => {
		const name = 'test';
		try {
			await axios.post(`${baseUrl}projects`, { name }, {
				headers: {
					'X-Session-Token': sessionToken,
				},
			});
			expect(true).toBe(true);
		} catch (error) {
			console.log(error);
			expect(true).toBe(false);
		}
		try {
			const res = await axios.get(`${baseUrl}projects/${name}`, {
				headers: {
					'X-Session-Token': sessionToken,
				},
			});
			const projectJson = res.data as ProjectJson;
			expect(projectJson.name).toBe(name);
			expect(projectJson.owner.username).toBe(username);
			expect(projectJson.createdAt).toBeDefined();
			expect(projectJson.updatedAt).toBeDefined();
		} catch (error) {
			console.log(error);
			expect(true).toBe(false);
		}
		try {
			await axios.delete(`${baseUrl}projects/${name}`, {
				headers: {
					'X-Session-Token': sessionToken,
				},
			});
			expect(true).toBe(true);
		} catch (error) {
			console.log(error);
		}
	});

	test('get project w/o login', async () => {
		const name = 'test';
		try {
			await axios.post(`${baseUrl}projects`, { name }, {
				headers: {
					'X-Session-Token': sessionToken,
				},
			});
			expect(true).toBe(true);
		} catch (error) {
			console.log(error);
			expect(true).toBe(false);
		}
		try {
			const res = await axios.get(`${baseUrl}projects/${name}`);
			const projectJson = res.data as ProjectJson;
			expect(projectJson.name).toBe(name);
			expect(projectJson.owner.username).toBe(username);
			expect(projectJson.createdAt).toBeDefined();
			expect(projectJson.updatedAt).toBeDefined();
		} catch (error) {
			console.log(error);
			expect(true).toBe(false);
		}
		try {
			await axios.delete(`${baseUrl}projects/${name}`, {
				headers: {
					'X-Session-Token': sessionToken,
				},
			});
			expect(true).toBe(true);
		} catch (error) {
			console.log(error);
		}
	});

	test('Successful create project w/ image', async () => {
		try {
			const name = 'test';
			const form = new FormData();
			const fileName = 'test.png';
			const file = fs.readFileSync(`./tests/${fileName}`);
			form.append('name', name);
			form.append('image', Buffer.from(file.buffer), fileName);
			const res = await axios.post(`${baseUrl}projects`, form, {
				headers: {
					'X-Session-Token': sessionToken,
				},
			});
			const projectJson = res.data as ProjectJson;
			expect(projectJson.name).toBe('test');
			expect(projectJson.owner.username).toBe(username);
			expect(projectJson.createdAt).toBeDefined();
			expect(projectJson.updatedAt).toBeDefined();
			expect(projectJson.icon).toBeDefined();
			expect(projectJson.icon!.name).toBeDefined();
			expect(projectJson.icon!.url).toBeDefined();
			const downloadFile = await axios.get(projectJson.icon!.url, {
				responseType: 'arraybuffer',
			});
			expect(downloadFile.data).toEqual(file);
			const deleteUrl = `${baseUrl}projects/${name}`;
			await axios.delete(deleteUrl, {
				headers: {
					'X-Session-Token': sessionToken,
				},
			});
			expect(true).toBe(true);
		} catch (error) {
			console.log(error);
			expect(true).toBe(false);
		}
	});

	test('Successful update project', async () => {
		try {
			const name = 'test2';
			const res = await axios.post(`${baseUrl}projects`, { name }, {
				headers: {
					'X-Session-Token': sessionToken,
				},
			});
			const projectJson = res.data as ProjectJson;
			expect(projectJson.name).toBe(name);
			expect(projectJson.owner.username).toBe(username);
			expect(projectJson.createdAt).toBeDefined();
			expect(projectJson.updatedAt).toBeDefined();
			const newName = 'Test3';
			const updateRes = await axios.put(`${baseUrl}projects/${projectJson.name}`, { name: newName }, {
				headers: {
					'X-Session-Token': sessionToken,
				},
			});
			const updatedProjectJson = updateRes.data as ProjectJson;
			expect(updatedProjectJson.name).toBe(newName);
			expect(updatedProjectJson.slug).toBe(newName.toLocaleLowerCase());
			expect(updatedProjectJson.owner.username).toBe(username);
			expect(updatedProjectJson.createdAt).toBeDefined();
			expect(updatedProjectJson.updatedAt).toBeDefined();
			const deleteUrl = `${baseUrl}projects/${newName}`;
			await axios.delete(deleteUrl, {
				headers: {
					'X-Session-Token': sessionToken,
				},
			});
			expect(true).toBe(true);
		} catch (error) {
			console.log(error);
			expect(true).toBe(false);
		}
	});

	test('get projects', async () => {
		for (let i = 0; i < 15; i++) {
			const name = `test${i}`;
			try {
				await axios.post(`${baseUrl}projects`, { name }, {
					headers: {
						'X-Session-Token': sessionToken,
					},
				});
			} catch (error) {
				console.log(error);
				expect(true).toBe(false);
			}
		}

		try {
			const res = await axios.get(`${baseUrl}projects`, {
				headers: {
					'X-Session-Token': sessionToken,
				},
			});
			const projects = res.data as ProjectJson[];
			expect(projects.length).toBe(10);
			for (let i = 0; i < 10; i++) {
				expect(projects[i].name).toBe(`test${i}`);
				// console.log(projects[i].name);
			}
		} catch (error) {
			console.log(error);
			expect(true).toBe(false);
		}

		try {
			const res = await axios.get(`${baseUrl}projects`, {
				params: {
					limit: 5,
					page: 2,
				},
				headers: {
					'X-Session-Token': sessionToken,
				},
			});
			const projects = res.data as ProjectJson[];
			expect(projects.length).toBe(5);
			for (let i = 5; i < 10; i++) {
				expect(projects[i - 5].name).toBe(`test${i}`);
			}
		} catch (error) {
			console.log(error);
			expect(true).toBe(false);
		}

		try {
			const res = await axios.get(`${baseUrl}projects`, {
				params: {
					limit: 5,
					page: 2,
					order: '-createdAt',
				},
				headers: {
					'X-Session-Token': sessionToken,
				},
			});
			const projects = res.data as ProjectJson[];
			expect(projects.length).toBe(5);
			for (let i = 0; i < 5; i++) {
				expect(projects[i].name).toBe(`test${9 - i}`);
			}
		} catch (error) {
			console.log(error);
			expect(true).toBe(false);
		}

		// Clean up
		for (let i = 0; i < 15; i++) {
			const name = `test${i}`;
			try {
				await axios.delete(`${baseUrl}projects/${name}`, {
					headers: {
						'X-Session-Token': sessionToken,
					},
				});
			} catch (error) {
				console.log(error);
			}
		}
	});

});
