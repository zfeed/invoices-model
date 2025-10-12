import { Result } from '../../../building-blocks';
import { IBilling } from './billing.interface';

export class Wire
    implements
        IBilling<
            'WIRE',
            {
                swift: string;
                accountNumber: string;
                accountHolderName: string;
                bankName: string;
                bankAddress: string;
                bankCountry: string;
            }
        >
{
    public readonly type = 'WIRE' as const;
    public readonly data: {
        swift: string;
        accountNumber: string;
        accountHolderName: string;
        bankName: string;
        bankAddress: string;
        bankCountry: string;
    };

    private constructor(data: {
        swift: string;
        accountNumber: string;
        accountHolderName: string;
        bankName: string;
        bankAddress: string;
        bankCountry: string;
    }) {
        this.data = data;
    }

    static create(data: {
        swift: string;
        accountNumber: string;
        accountHolderName: string;
        bankName: string;
        bankAddress: string;
        bankCountry: string;
    }) {
        return Result.ok(new Wire(data));
    }

    toPlain() {
        return {
            type: this.type,
            data: {
                swift: this.data.swift,
                accountNumber: this.data.accountNumber,
                accountHolderName: this.data.accountHolderName,
                bankName: this.data.bankName,
                bankAddress: this.data.bankAddress,
                bankCountry: this.data.bankCountry,
            },
        };
    }
}
