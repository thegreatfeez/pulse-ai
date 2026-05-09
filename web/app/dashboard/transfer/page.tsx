'use client'

import React, { ChangeEvent, FormEvent, useState, useEffect } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { BiCheckCircle } from 'react-icons/bi'
import { MdSend, MdVerified } from 'react-icons/md'
import { useUsdcBalance } from '@/hooks/use-usdc-balance'
import { useP2PSend } from '@/hooks/use-p2p-send'
import { useWallet } from '@/app/context/WalletContext'
import { P2P_TRANSFER_ADDRESS } from '@/lib/contracts'
import { BASESCAN_ADDR_BASE, BASESCAN_TX_BASE, MAX_MEMO_BYTES } from '@/lib/constants'
import { formatUsdc, parseUsdcInput, memoBytesUsed, shortenAddress, isAddressLike } from '@/lib/format'

type FormData = {
    recipient: string
    amount: string
    memo: string
}

const P2P = () => {
    const { isWrongNetwork, switchToBaseSepolia } = useWallet()
    const [formData, setFormData] = useState<FormData>({ recipient: '', amount: '', memo: '' })
    const [validationError, setValidationError] = useState<string | null>(null)

    const { balance: walletUsdcRaw, refetch: refetchBalance } = useUsdcBalance()
    const sendFlow = useP2PSend()

    const walletUsdc = walletUsdcRaw ?? 0n
    const memoBytes = memoBytesUsed(formData.memo)

    useEffect(() => {
        if (sendFlow.isSuccess) {
            void refetchBalance()
        }
    }, [sendFlow.isSuccess, refetchBalance])

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        setValidationError(null)
    }

    const handleMax = () => {
        setFormData((prev) => ({ ...prev, amount: formatUsdc(walletUsdc).replace(/,/g, '') }))
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setValidationError(null)

        if (isWrongNetwork) {
            await switchToBaseSepolia().catch(() => {})
            return
        }

        if (!isAddressLike(formData.recipient)) {
            setValidationError('Invalid recipient address.')
            return
        }
        let amountRaw: bigint
        try {
            amountRaw = parseUsdcInput(formData.amount)
        } catch (err) {
            setValidationError((err as Error).message)
            return
        }
        if (amountRaw > walletUsdc) {
            setValidationError('Amount exceeds wallet balance.')
            return
        }
        if (memoBytes > MAX_MEMO_BYTES) {
            setValidationError(`Memo too long (${memoBytes}/${MAX_MEMO_BYTES} bytes)`)
            return
        }

        await sendFlow.send(formData.recipient, amountRaw, formData.memo)
    }

    const handleReset = () => {
        sendFlow.reset()
        setFormData({ recipient: '', amount: '', memo: '' })
    }

    return (
        <>
            <section className="transfer">
                <form onSubmit={handleSubmit}>
                    <h3>New Transfer</h3>

                    <div className="item">
                        <label htmlFor="recipient">Recipient</label>
                        <input
                            type="text"
                            name="recipient"
                            placeholder="0x... wallet address"
                            value={formData.recipient}
                            onChange={handleChange}
                            disabled={sendFlow.isPending}
                            required
                        />
                    </div>

                    <div className="balance">
                        <label htmlFor="amount">Amount (USDC)</label>
                        <div>
                            <span>Balance:</span>
                            <b>{formatUsdc(walletUsdc)} USDC</b>
                        </div>
                    </div>

                    <div className="item item2">
                        <input
                            type="text"
                            inputMode="decimal"
                            name="amount"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={handleChange}
                            disabled={sendFlow.isPending}
                            required
                        />
                        <div>
                            <button type="button" onClick={handleMax} disabled={sendFlow.isPending}>Max</button>
                            <span>USDC</span>
                        </div>
                    </div>

                    <div className="item">
                        <label htmlFor="memo">Memo (optional, on-chain)</label>
                        <textarea
                            name="memo"
                            placeholder="What is this for?"
                            value={formData.memo}
                            onChange={handleChange}
                            disabled={sendFlow.isPending}
                            maxLength={512}
                            className='memo-input'
                        />
                        <span className={memoBytes > MAX_MEMO_BYTES ? 'memo-counter memo-counter-over' : 'memo-counter'}>
                            {memoBytes}/{MAX_MEMO_BYTES} bytes
                        </span>
                    </div>

                    <div className="fee">
                        <div className="network">
                            <span>Network</span>
                            <span>Base Sepolia</span>
                        </div>

                        <div>
                            <span>Total to send</span>
                            <span>{formData.amount || '0.00'} USDC</span>
                        </div>
                    </div>

                    {sendFlow.step !== 'idle' && !sendFlow.isSuccess && sendFlow.step !== 'error' && (
                        <div className='flow-progress' style={{ marginBottom: 12 }}>
                            <span className={['approving', 'waiting_approve'].includes(sendFlow.step) ? 'fp-active' : ['sending', 'waiting_send'].includes(sendFlow.step) ? 'fp-done' : 'fp-pending'}>
                                {['approving', 'waiting_approve'].includes(sendFlow.step) ? '⏳' : ['sending', 'waiting_send'].includes(sendFlow.step) ? '✓' : '○'} 1. Approve USDC
                            </span>
                            <span className='fp-line' />
                            <span className={['sending', 'waiting_send'].includes(sendFlow.step) ? 'fp-active' : 'fp-pending'}>
                                {['sending', 'waiting_send'].includes(sendFlow.step) ? '⏳' : '○'} 2. Send
                            </span>
                        </div>
                    )}

                    {(validationError || sendFlow.errorMessage) && (
                        <div className='form-alert form-alert-error' style={{ marginBottom: 12 }}>
                            {validationError ?? sendFlow.errorMessage}
                        </div>
                    )}

                    <button type="submit" disabled={sendFlow.isPending || sendFlow.isSuccess}>
                        {sendFlow.isPending ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <Loader2 size={16} className='spin' />
                                {['approving', 'waiting_approve'].includes(sendFlow.step) ? 'Approving...' : 'Sending...'}
                            </span>
                        ) : isWrongNetwork ? 'Switch to Base Sepolia' : (
                            <>
                                <MdSend size={16} style={{ marginBottom: '-3px' }} /> Confirm transfer
                            </>
                        )}
                    </button>
                </form>

                <div className="txComplete">
                    {sendFlow.isSuccess && sendFlow.txHash ? (
                        <div className="finalized">
                            <div>
                                <p style={{ color: 'var(--success)', fontWeight: 600, margin: '10px 0' }}>
                                    <MdVerified size={18} style={{ marginRight: '10px', marginBottom: '-3px' }} />
                                    Transaction finalized
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                                    <span style={{ width: '85%' }}>
                                        Your {formData.amount} USDC has been settled on-chain via Base Sepolia.
                                    </span>
                                    <span style={{ width: '12%' }}>
                                        <BiCheckCircle size={30} />
                                    </span>
                                </div>
                            </div>

                            <div className="view">
                                <a
                                    className="btnn1"
                                    href={`${BASESCAN_TX_BASE}${sendFlow.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                                >
                                    View on BaseScan <ExternalLink size={12} />
                                </a>
                                <button className="btnn2" type="button" onClick={handleReset}>Send another</button>
                            </div>
                        </div>
                    ) : (
                        <div className="finalized" style={{ opacity: 0.6 }}>
                            <p style={{ fontWeight: 600, margin: '10px 0', color: 'var(--text-secondary)' }}>
                                Awaiting your transfer
                            </p>
                            <span style={{ width: '100%', display: 'block', color: 'var(--text-secondary)', fontSize: 13 }}>
                                Confirmation and a BaseScan receipt link will appear here.
                            </span>
                        </div>
                    )}

                    <div className="s-about">
                        <p>
                            Stash is a non-custodial USDC neobank built on Base — funds move directly from
                            your wallet to the recipient through the verified P2PTransfer contract.
                        </p>
                        <p style={{ fontWeight: 600, marginTop: '20px' }}>
                            Transfer contract:{' '}
                            <a href={`${BASESCAN_ADDR_BASE}${P2P_TRANSFER_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>
                                {shortenAddress(P2P_TRANSFER_ADDRESS)} <ExternalLink size={10} style={{ display: 'inline', marginBottom: -1 }} />
                            </a>
                        </p>
                    </div>
                </div>
            </section>
        </>
    )
}

export default P2P
