import { Circuit } from "@/credential/credential";
import { VKey } from "@/crypto/babyzk/deps";
import { Eta } from "@/site-packages/eta/browser.js";
import { formatCode } from "./utils";

const eta = new Eta({
  autoEscape: false,
});

/**
 * render generates the solidity verifier code for a credential type.
 */
export function render(circut: Circuit, vkey: VKey): string {
  return formatCode(
    eta.renderString(tmpl, {
      vkey,
      pubSignals: circut.publicSignalDefs,
    })
  );
}

const tmpl = `
// SPDX-License-Identifier: GPL-3.0
/*
    Copyright (c) 2021 0KIMS association.
    Copyright (c) [2024] Galxe.com.

    Modifications to this file are part of the Galxe Identity Protocol SDK,
    which is built using the snarkJS template and is subject to the GNU
    General Public License v3.0.

    snarkJS is free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.8.4 <0.9.0;

contract BabyZKGroth16Verifier {
    error AliasedPublicSignal();

    // Scalar field size
    uint256 constant r   = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = <%= it.vkey.vk_alpha_1[0]    %>;
    uint256 constant alphay  = <%= it.vkey.vk_alpha_1[1]    %>;
    uint256 constant betax1  = <%= it.vkey.vk_beta_2[0][1]  %>;
    uint256 constant betax2  = <%= it.vkey.vk_beta_2[0][0]  %>;
    uint256 constant betay1  = <%= it.vkey.vk_beta_2[1][1]  %>;
    uint256 constant betay2  = <%= it.vkey.vk_beta_2[1][0]  %>;
    uint256 constant gammax1 = <%= it.vkey.vk_gamma_2[0][1] %>;
    uint256 constant gammax2 = <%= it.vkey.vk_gamma_2[0][0] %>;
    uint256 constant gammay1 = <%= it.vkey.vk_gamma_2[1][1] %>;
    uint256 constant gammay2 = <%= it.vkey.vk_gamma_2[1][0] %>;
    uint256 constant deltax1 = <%= it.vkey.vk_delta_2[0][1] %>;
    uint256 constant deltax2 = <%= it.vkey.vk_delta_2[0][0] %>;
    uint256 constant deltay1 = <%= it.vkey.vk_delta_2[1][1] %>;
    uint256 constant deltay2 = <%= it.vkey.vk_delta_2[1][0] %>;

<% for (let i=0; i<it.vkey.IC.length; i++) { %>
    uint256 constant IC<%=i%>x = <%=it.vkey.IC[i][0]%>;
    uint256 constant IC<%=i%>y = <%=it.vkey.IC[i][1]%>;
<% } %>
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    uint16 constant proofLength = 8;
    uint32 constant pubSignalLength = <%=it.vkey.IC.length-1%>;

    /// @dev returns the verification keys in the order that the verifier expects them:
    /// alpha, beta, gamma, delta, ICs..
    function getVerificationKeys() public pure returns (uint[] memory) {
        uint[] memory vks = new uint[](16 + pubSignalLength * 2);
        vks[0] = <%= it.vkey.vk_alpha_1[0]    %>;
        vks[1] = <%= it.vkey.vk_alpha_1[1]    %>;
        vks[2] = <%= it.vkey.vk_beta_2[0][1]  %>;
        vks[3] = <%= it.vkey.vk_beta_2[0][0]  %>;
        vks[4] = <%= it.vkey.vk_beta_2[1][1]  %>;
        vks[5] = <%= it.vkey.vk_beta_2[1][0]  %>;
        vks[6] = <%= it.vkey.vk_gamma_2[0][1] %>;
        vks[7] = <%= it.vkey.vk_gamma_2[0][0] %>;
        vks[8] = <%= it.vkey.vk_gamma_2[1][1] %>;
        vks[9] = <%= it.vkey.vk_gamma_2[1][0] %>;
        vks[10] = <%= it.vkey.vk_delta_2[0][1] %>;
        vks[11] = <%= it.vkey.vk_delta_2[0][0] %>;
        vks[12] = <%= it.vkey.vk_delta_2[1][1] %>;
        vks[13] = <%= it.vkey.vk_delta_2[1][0] %>;
<% for (let i=0; i<it.vkey.IC.length; i++) { %>
        vks[<%=14+i*2%>] = <%=it.vkey.IC[i][0]%>;
        vks[<%=15+i*2%>] = <%=it.vkey.IC[i][1]%>;
<% } %>
        return vks;
    }

    /// @dev return true if the public signal is aliased
    function isAliased(uint[] calldata _pubSignals) public pure returns (bool) {
        // Alias check
<% for (let i=0; i<it.pubSignals.length; i++) { %>
        if (_pubSignals[<%=i%>] >= <%=it.pubSignals[i].ceiling%>) { return true; }
<% } %>
        return false;
    }

    function verifyProof(uint[] calldata _proofs, uint[] calldata _pubSignals) public view returns (bool) {
        // Check Argument
        require(_proofs.length == proofLength, "Invalid proof");
        require(_pubSignals.length == pubSignalLength, "Invalid public signal");
        if (isAliased(_pubSignals)) { return false; }
        assembly {
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination it.vkey.vk_x
<% for (let i = 1; i <= it.vkey.nPublic; i++) { %>
                g1_mulAccC(_pVk, IC<%=i%>x, IC<%=i%>y, calldataload(add(pubSignals, <%=(i-1)*32%>)))
<% } %>
                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // it.vkey.vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate all evaluations
            let isValid := checkPairing(_proofs.offset, add(_proofs.offset, 64), add(_proofs.offset, 192), _pubSignals.offset, pMem)

            mstore(0, isValid)
            return(0, 0x20)
        }
    }
}`;
