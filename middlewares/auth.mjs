export const requireRoles = targetRoles => async (ctx, next) => {
    if (!ctx.state.user) {
        ctx.status = 401;
        ctx.body = { error };
        return;
    }

    const { user } = ctx.state;

    if (Array.isArray(user.roles) &&
        targetRoles.every(target => user.roles.includes(target))) {
        await next();
    } else {
        const error = "Missing required role(s) to perform operation"
        ctx.status = 403;
        ctx.body = { error };
    }
};

export const requireSignIn = async (ctx, next) => {
    if (!ctx.state.user) {

        const error = "Authentication required to perform operation";
        ctx.status = 401;
        ctx.body = { error };
    } else {
        await next();
    }
};