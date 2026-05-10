import React, { useState, useEffect } from "react";
import { Loader2, Phone, ShieldCheck } from "lucide-react";
import { sendVerificationCode } from "@/functions/sendVerificationCode";
import { checkVerificationCode } from "@/functions/checkVerificationCode";

export default function PhoneVerifyNode({ node, fieldValues, runId, onNext, onFail }) {
  const config = node.config || {};
  const phoneField = config.phone_field || 'phone';
  const codeLength = config.code_length || 6;
  const maxAttempts = config.max_attempts || 3;

  const [phone, setPhone] = useState(fieldValues[phoneField] || '');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [notConfigured, setNotConfigured] = useState(false);

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const handleSend = async () => {
    if (!phone.trim()) { setError('Please enter your phone number'); return; }
    setSending(true);
    setError('');
    try {
      const res = await sendVerificationCode({ runId, nodeId: node.id, phone });
      if (res.data?.configured === false) {
        setNotConfigured(true);
        onFail && onFail();
        return;
      }
      if (res.data?.success) {
        setCodeSent(true);
        setCooldown(60);
      } else {
        setError(res.data?.error || 'Failed to send code');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (code.length < codeLength) { setError(`Please enter the ${codeLength}-digit code`); return; }
    setChecking(true);
    setError('');
    try {
      const res = await checkVerificationCode({ runId, nodeId: node.id, phone, code });
      if (res.data?.approved) {
        onNext(res.data.next_node_id);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= maxAttempts) {
          onFail && onFail(res.data?.next_node_id);
        } else {
          setError(`Incorrect code. ${maxAttempts - newAttempts} attempt${maxAttempts - newAttempts !== 1 ? 's' : ''} remaining.`);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  };

  if (notConfigured) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <p className="text-slate-500">Phone verification is unavailable. Please contact support.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      <div className="flex justify-center mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--rt-primary, #0284c7)' }}>
          <Phone className="w-7 h-7 text-white" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center mb-2">{node.title_display || 'Verify Your Phone'}</h2>
      <p className="text-slate-500 text-center mb-6">{node.help_text || 'We need to verify your phone number.'}</p>

      {!codeSent ? (
        <div className="space-y-4">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 555-5555"
            className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 text-center text-lg tracking-widest focus:border-[var(--rt-primary,#0284c7)] outline-none"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button onClick={handleSend} disabled={sending}
            className="w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: 'var(--rt-primary, #0284c7)' }}>
            {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Verification Code'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-center text-sm text-slate-500">Code sent to {phone}</p>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, codeLength))}
            placeholder={'•'.repeat(codeLength)}
            maxLength={codeLength}
            className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 text-center text-2xl tracking-[0.5em] focus:border-[var(--rt-primary,#0284c7)] outline-none"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button onClick={handleVerify} disabled={checking}
            className="w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: 'var(--rt-primary, #0284c7)' }}>
            {checking ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : <><ShieldCheck className="w-4 h-4" /> Verify Code</>}
          </button>
          <button onClick={() => { if (cooldown === 0) handleSend(); }}
            disabled={cooldown > 0}
            className="w-full text-sm text-slate-500 hover:text-slate-700 disabled:opacity-40">
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      )}
    </div>
  );
}