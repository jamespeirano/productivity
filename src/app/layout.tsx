import './globals.css';
import { Inter } from 'next/font/google';
import { ProjectProvider } from './contexts/ProjectContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Pomodoro App',
  description: 'A productivity app to help you focus and get things done',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ProjectProvider>
          {children}
        </ProjectProvider>
      </body>
    </html>
  );
}
