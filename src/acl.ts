
export const generateAcl = (name: string, user: Parse.User): Parse.ACL => {
	// Set acl
	const acl = new Parse.ACL();
	acl.setPublicReadAccess(false);
	acl.setPublicWriteAccess(false);
	acl.setRoleReadAccess('admin', true);
	acl.setRoleWriteAccess('admin', true);
	// Project name
	acl.setRoleReadAccess(name, true);
	acl.setRoleWriteAccess(name, true);
	acl.setReadAccess(user, true);
	acl.setWriteAccess(user, true);
	return acl;
};

