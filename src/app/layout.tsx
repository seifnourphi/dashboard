import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { SecurityShield } from '@/components/providers/SecurityShield';

export const metadata: Metadata = {
    title: 'Ridaa Admin Dashboard | لوحة تحكم رِداء',
    description: 'لوحة تحكم إدارة متجر رِداء للأزياء الإسلامية',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ar" dir="rtl">
            <body>
                <SecurityShield>
                    <LanguageProvider>
                        <ToastProvider>
                            {children}
                        </ToastProvider>
                    </LanguageProvider>
                </SecurityShield>
            </body>
        </html>
    );
}
