import axios, { Axios, AxiosError } from 'axios';
import config from '../config.json';
const baseUrl = config.apps[0].serverURL;

test('Successful sign up', async () => {
  const res = await axios.post(`${baseUrl}users`, {
    username: 'test',
    password: 'test',
  });
  const params = res.data;
  expect(params.objectId).toBeDefined();
  expect(params.createdAt).toBeDefined();
  expect(params.sessionToken).toBeDefined();
  const res2 = await axios.delete(`${baseUrl}users/${params.objectId}`, {
    headers: {
      'X-Session-Token': params.sessionToken,
    },
  });
  expect(Object.keys(res2.data).length).toBe(0);
  expect(true).toBe(true);
});

test('Duplicate sign up', async () => {
  const res = await axios.post(`${baseUrl}users`, {
    username: 'test',
    password: 'test',
  });
  const params = res.data;
  expect(params.objectId).toBeDefined();
  expect(params.createdAt).toBeDefined();
  expect(params.sessionToken).toBeDefined();
  try {
      await axios.post(`${baseUrl}users`, {
      username: 'test',
      password: 'test',
    });
    expect(true).toBe(false);
  } catch (error) {
    expect((error as AxiosError).response!.status).toBe(400);
  }
  await axios.delete(`${baseUrl}users/${params.objectId}`, {
    headers: {
      'X-Session-Token': params.sessionToken,
    },
  });
});
