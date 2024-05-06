# KOYU

KOYU is cloud messaging platform. You can develop a chat, forum, comment system, etc. with KOYU.

## Features

- Real-time messaging
- User authentication
- CRUD message with ACL
- Post images

## API

### Authentication

- [x] Sign up
- [x] Sign in
- [ ] Sign out

### User

- [ ] Get user
- [ ] Update user
- [ ] Delete user

### Project

- [x] Create project
	- [x] with Icon image
- [x] Get projects
- [x] Get project
- [x] Update project
- [x] Delete project

### Channel

- [ ] Create channel
- [ ] Get channels
- [ ] Get channel
- [ ] Update channel
- [ ] Delete channel

### Thread

- [ ] Create thread
- [ ] Get threads
- [ ] Get thread
- [ ] Update thread
- [ ] Delete thread

### Message

- [ ] Create message
- [ ] Get messages
- [ ] Get message
- [ ] Update message
- [ ] Delete message

### Group

- [ ] Create group
- [ ] Get groups
- [ ] Get group
- [ ] Update group
- [ ] Delete group

### Member

- [ ] Create member
- [ ] Get members
- [ ] Get member
- [ ] Update member
- [ ] Delete member

## Direcotry

```
├── dist              # Compiled files
├── files             # Uploaded files for KOYU
├── logs              # Log files
├── src               # Source files
│   ├── channels     # API /projects/:projectId/channels
│   ├── cloud        # Cloud functions
│   ├── files        # API /files
│   ├── messages     # API /projects/:projectId/channels/:channelId/messages
│   ├── projects     # API /projects
│   └── types        # TypeScript types
├── tests             # Test files
└── tmp               # Temporary files for Express
```

## Requirements

- Node.js v20
- MongoDB or PostgreSQL
- Redis

## Development

### Install

```bash
$ npm install
```

### Update config

```bash
$ cp .env.example .env
$ cp config.example.json config.json
```

### Start mongo & redis

```bash
sh start.sh
```

### Watch typescript

```bash
$ npm run watch
```

### Start server

```bash
$ npm start
```

You can access to the server at `http://localhost:1337`.

## License

MIT
