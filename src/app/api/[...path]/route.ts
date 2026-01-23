import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyRequest(request, params.path, 'GET');
}

export async function POST(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyRequest(request, params.path, 'POST');
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyRequest(request, params.path, 'PUT');
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyRequest(request, params.path, 'DELETE');
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return proxyRequest(request, params.path, 'PATCH');
}

async function proxyRequest(
    request: NextRequest,
    pathSegments: string[],
    method: string
) {
    const path = pathSegments.join('/');

    // Include query parameters in the proxied URL
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : '';
    const url = `${BACKEND_URL}/api/${path}${queryString}`;

    console.log('🔄 Proxying request to:', url);

    const headers: Record<string, string> = {};

    // Forward relevant headers
    const headersToForward = [
        'content-type',
        'authorization',
        'cookie',
        'x-csrf-token',
    ];

    headersToForward.forEach((header) => {
        const value = request.headers.get(header);
        if (value) {
            headers[header] = value;
        }
    });

    try {
        let body: BodyInit | undefined;
        let requestHeaders = { ...headers };

        if (method !== 'GET' && method !== 'HEAD') {
            const contentType = request.headers.get('content-type');

            // Read body exactly once as ArrayBuffer to avoid "stream is locked" errors
            try {
                const arrayBuffer = await request.arrayBuffer();
                if (arrayBuffer.byteLength > 0) {
                    body = arrayBuffer;
                }
            } catch (e) {
                console.error('❌ Error reading request body:', e);
            }

            if (contentType) {
                requestHeaders['content-type'] = contentType;
            }
        }

        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body,
            credentials: 'include',
        });

        // Get response metadata
        const contentType = response.headers.get('content-type') || '';
        const isBinary = contentType.includes('application/pdf') ||
            contentType.includes('image/') ||
            contentType.includes('application/octet-stream');

        let responseBody: any;
        if (isBinary) {
            responseBody = await response.arrayBuffer();
        } else {
            responseBody = await response.text();
        }

        // Create response with same status and headers
        const responseHeaders = new Headers();

        // Forward important response headers
        const headersToReturn = [
            'content-type',
            'content-disposition',
            'x-csrf-token',
        ];

        headersToReturn.forEach((header) => {
            const value = response.headers.get(header);
            if (value) {
                responseHeaders.set(header, value);
            }
        });

        // Special handling for Set-Cookie to ensure all cookies are forwarded
        if (response.headers.has('set-cookie')) {
            const setCookies = response.headers.getSetCookie
                ? response.headers.getSetCookie()
                : [response.headers.get('set-cookie')!];

            setCookies.forEach(cookie => {
                responseHeaders.append('set-cookie', cookie);
            });
        }

        return new NextResponse(responseBody, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });
    } catch (error: any) {
        console.error('❌ Proxy error:', {
            method,
            url,
            message: error.message,
            stack: error.stack
        });
        return NextResponse.json(
            { error: 'Failed to proxy request to backend', details: error.message },
            { status: 502 }
        );
    }
}
