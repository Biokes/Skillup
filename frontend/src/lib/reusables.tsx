import {Loader2} from "lucide-react";
import {motion} from "framer-motion";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {useState} from "react";

export function ConnectingSection({ onCancel }: { onCancel: () => void }) {
    return (
        <section className='connecting'>
            <Loader2 className="loading" />
            <motion.h5
                className="ribeye text-gradient"
                animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
            >
                Connecting to game server
            </motion.h5>
            <Button className="cancelButton" onClick={onCancel}>Cancel</Button>
        </section>
    );
}

export function FailedConnectionSection({ onRetry, onCancel }: { onRetry: () => void; onCancel: () => void }) {
    return (
        <section className="failedConnection">
            <p className="text-gradient">Cannot find opponent</p>
            <footer>
                <Button onClick={onRetry}>Try Again</Button>
                <Button onClick={onCancel}>Cancel</Button>
            </footer>
        </section>
    );
}

export function CodeInput({ code, setCode, onProceed, onCancel }: { code: string; setCode: (v: string) => void; onProceed: () => void; onCancel: () => void}) {
    return (
        <section className='codeCreator'>
            <Input type="text" placeholder="Enter code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            <div>
                <Button disabled={code.length !== 6} onClick={onProceed}>Proceed</Button>
                <Button onClick={onCancel}>Cancel</Button>
            </div>
        </section>
    );
}

export function PaymentInput({ stakeAmount, setStakeAmount, onProceed, onCancel, balance }: { balance: number; stakeAmount: number; setStakeAmount: (v: number) => void; onProceed: () => void; onCancel: () => void }) {
    const [pos, setPos] = useState<number>(-1);
    return (
        <section className='codeCreator'>
            <section>
                <p>Bal: {balance}</p>
            </section>
            <div >
                {['0.1','0.5','1','5'].map((val, index) => (
                    <p key={index} className={`${pos === index ? 'bg-primary/20' : ''}`}
                       onClick={() => {
                           setPos(index)
                           setStakeAmount(Number(val))
                       }}
                    >{val} ONE</p>
                ))}
            </div>
            <div>
                <Button disabled={stakeAmount<0 || pos === -1 || balance < stakeAmount} onClick={onProceed}>Pay</Button>
                <Button onClick={() => {
                    setPos(-1)
                    setStakeAmount(0)
                    onCancel()
                }}>Cancel</Button>
            </div>
        </section>
    );
}