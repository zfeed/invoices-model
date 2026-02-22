import { Mappable, Result } from '../../../../../building-blocks';
import { IBilling } from './billing.interface';
import { checkSwift } from './checks/check-swift';
import { checkBankCountry } from './checks/check-bank-country';
import { checkWireNonEmpty } from './checks/check-wire-non-empty';

type WireData = {
    swift: string;
    accountNumber: string;
    accountHolderName: string;
    bankName: string;
    bankAddress: string;
    bankCountry: string;
};

export class Wire
    implements
        Mappable<ReturnType<Wire['toPlain']>>,
        IBilling<'WIRE', WireData>
{
    public readonly type = 'WIRE' as const;
    public readonly data: WireData;

    protected constructor(data: WireData) {
        this.data = data;
    }

    static fromPlain(plain: ReturnType<Wire['toPlain']>) {
        return new Wire(plain.data);
    }

    static create(data: WireData) {
        const error =
            checkSwift(data.swift) ??
            checkWireNonEmpty('accountNumber', data.accountNumber) ??
            checkWireNonEmpty('accountHolderName', data.accountHolderName) ??
            checkWireNonEmpty('bankName', data.bankName) ??
            checkWireNonEmpty('bankAddress', data.bankAddress) ??
            checkBankCountry(data.bankCountry);

        if (error) {
            return Result.error(error);
        }

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
