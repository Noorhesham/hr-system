export declare class CreateRoleDto {
    name: string;
    description?: string;
    permissionActions: string[];
}
export declare class UpdateRoleDto {
    name?: string;
    description?: string;
    isActive?: boolean;
    permissionActions?: string[];
}
export declare class AssignUserRoleDto {
    roleId: string;
}
export declare class UnassignUsersDto {
    userIds: string[];
}
