import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { success: false, message: 'No authorization header provided' },
                { status: 401 }
            );
        }

        const body = await request.json();

        const response = await axios.post(
        `${BACKEND_URL}/stripe/create-checkout-session`,
            body,
            {
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                },
                validateStatus: () => true, // Accept all status codes
            }
        );

        if (response.status < 200 || response.status >= 300) {
            return NextResponse.json(
                { success: false, message: response.data?.message || 'Failed to create checkout session' },
                { status: response.status }
            );
        }

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Stripe checkout session API error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
