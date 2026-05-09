'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@/app/context/WalletContext';
import { ConnectButton } from './connect-button';
import styles from '@/app/page.module.css';

export function LandingHeroCta() {
  const { isConnected } = useWallet();

  if (isConnected) {
    return (
      <div className={styles.heroActions}>
        <Link href="/dashboard/overview" className={styles.primaryButton}>
          Open dashboard
          <ArrowRight size={18} />
        </Link>
        <Link href="/dashboard/flexible" className={styles.secondaryButton}>
          Explore savings
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.heroActions}>
      <ConnectButton label="Get started" variant="primary" />
      <Link href="/dashboard/flexible" className={styles.secondaryButton}>
        Explore savings
      </Link>
    </div>
  );
}
