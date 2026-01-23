import { NextResponse } from 'next/server';

/**
 * CSRF token endpoint for admin-dashboard
 * Generates a random token and sets it as a non-HttpOnly cookie
 */
export async function GET() {
    try {
        // Generate a random token
        const token =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);

        const response = NextResponse.json({
            csrfToken: token,
        });

        // Set non-HttpOnly cookie so backend (via proxy) receives it 
        // and frontend JS can also read/use it for headers.
        const isProduction = process.env.NODE_ENV === 'production';

        response.cookies.set('adminCsrfToken', token, {
            httpOnly: false,
            sameSite: 'lax',
            secure: isProduction,
            path: '/',
            maxAge: 60 * 60 * 24, // 24 hours
        });

        return response;
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to generate CSRF token',
            },
            { status: 500 }
        );
    }
}
