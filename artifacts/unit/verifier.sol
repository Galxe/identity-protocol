
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
    uint256 constant alphax  = 20491192805390485299153009773594534940189261866228447918068658471970481763042;
    uint256 constant alphay  = 9383485363053290200918347156157836566562967994039712273449902621266178545958;
    uint256 constant betax1  = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
    uint256 constant betax2  = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
    uint256 constant betay1  = 21847035105528745403288232691147584728191162732299865338377159692350059136679;
    uint256 constant betay2  = 10505242626370262277552901082094356697409835680220590971873171140371331206856;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 15637418380756236601718213192255613136045919407816081601661261207618084073597;
    uint256 constant deltax2 = 16569784677986731884848814767977081422246581497389376666284070100669021849313;
    uint256 constant deltay1 = 17775141888156869748745527945157624548875521553021038167785799262294965116348;
    uint256 constant deltay2 = 3246184716089128973746765775249737516048676435198106546989660202706440984521;

    uint256 constant IC0x = 4990317659614575818156037472214188417509096922233331003555642014823238651184;
    uint256 constant IC0y = 14469248329543848838153834859360699519345616103861941229956057140145693492508;
    uint256 constant IC1x = 10837138624576207424789978193086542153499320344753530437477168438248082178960;
    uint256 constant IC1y = 917015773848957701033958467874666708682927187095469719889324478895656869516;
    uint256 constant IC2x = 5037499117481750214477112555364145021274012966256645948893036512248435385840;
    uint256 constant IC2y = 19826826480151452757007846213434794238926452546710485787711011712233552633495;
    uint256 constant IC3x = 20945528997632428738612501906743782336475532295455403104686278305604488099835;
    uint256 constant IC3y = 20744191411948171901695905522237963923426425453283062602166914445806285227301;
    uint256 constant IC4x = 8513991002836348269358097045344942553237626798000929884704947463798784967405;
    uint256 constant IC4y = 19338209321160679542018365847622795887832971526814598737666811533118912666856;
    uint256 constant IC5x = 3569844613050455610552335538126280293963365442570334539158228936972825900539;
    uint256 constant IC5y = 16528366039144804325194354617729911304908458001966274902042903564466963990992;
    uint256 constant IC6x = 1570945769731720797444624982944778925162368447218125765326050361254312822358;
    uint256 constant IC6y = 2602548857774106882745290052940216670975889108043343483573122286840504404756;
    uint256 constant IC7x = 21301906662599840990524780602285271554623267433315428422652065889924533228332;
    uint256 constant IC7y = 11716127211538228300463074562279867241595264693476507064906125029152968407192;
    uint256 constant IC8x = 11201724637271039764798623441350903487110912630994328063735802041659149290802;
    uint256 constant IC8y = 9584899601398928135093189759789914293671858783478336033800854558608680407297;
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    uint16 constant proofLength = 8;
    uint32 constant pubSignalLength = 8;

    /// @dev returns the verification keys in the order that the verifier expects them:
    /// alpha, beta, gamma, delta, ICs..
    function getVerificationKeys() public pure returns (uint[] memory) {
        uint[] memory vks = new uint[](16 + pubSignalLength * 2);
        vks[0] = 20491192805390485299153009773594534940189261866228447918068658471970481763042;
        vks[1] = 9383485363053290200918347156157836566562967994039712273449902621266178545958;
        vks[2] = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
        vks[3] = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
        vks[4] = 21847035105528745403288232691147584728191162732299865338377159692350059136679;
        vks[5] = 10505242626370262277552901082094356697409835680220590971873171140371331206856;
        vks[6] = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
        vks[7] = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
        vks[8] = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
        vks[9] = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
        vks[10] = 15637418380756236601718213192255613136045919407816081601661261207618084073597;
        vks[11] = 16569784677986731884848814767977081422246581497389376666284070100669021849313;
        vks[12] = 17775141888156869748745527945157624548875521553021038167785799262294965116348;
        vks[13] = 3246184716089128973746765775249737516048676435198106546989660202706440984521;
        vks[14] = 4990317659614575818156037472214188417509096922233331003555642014823238651184;
        vks[15] = 14469248329543848838153834859360699519345616103861941229956057140145693492508;
        vks[16] = 10837138624576207424789978193086542153499320344753530437477168438248082178960;
        vks[17] = 917015773848957701033958467874666708682927187095469719889324478895656869516;
        vks[18] = 5037499117481750214477112555364145021274012966256645948893036512248435385840;
        vks[19] = 19826826480151452757007846213434794238926452546710485787711011712233552633495;
        vks[20] = 20945528997632428738612501906743782336475532295455403104686278305604488099835;
        vks[21] = 20744191411948171901695905522237963923426425453283062602166914445806285227301;
        vks[22] = 8513991002836348269358097045344942553237626798000929884704947463798784967405;
        vks[23] = 19338209321160679542018365847622795887832971526814598737666811533118912666856;
        vks[24] = 3569844613050455610552335538126280293963365442570334539158228936972825900539;
        vks[25] = 16528366039144804325194354617729911304908458001966274902042903564466963990992;
        vks[26] = 1570945769731720797444624982944778925162368447218125765326050361254312822358;
        vks[27] = 2602548857774106882745290052940216670975889108043343483573122286840504404756;
        vks[28] = 21301906662599840990524780602285271554623267433315428422652065889924533228332;
        vks[29] = 11716127211538228300463074562279867241595264693476507064906125029152968407192;
        vks[30] = 11201724637271039764798623441350903487110912630994328063735802041659149290802;
        vks[31] = 9584899601398928135093189759789914293671858783478336033800854558608680407297;
        return vks;
    }

    /// @dev return true if the public signal is aliased
    function isAliased(uint[] calldata _pubSignals) public pure returns (bool) {
        // Alias check
        if (_pubSignals[0] >= 1461501637330902918203684832716283019655932542976) { return true; }
        if (_pubSignals[1] >= 1461501637330902918203684832716283019655932542976) { return true; }
        if (_pubSignals[2] >= 21888242871839275222246405745257275088548364400416034343698204186575808495617) { return true; }
        if (_pubSignals[3] >= 1461501637330902918203684832716283019655932542976) { return true; }
        if (_pubSignals[4] >= 452312848583266388373324160190187140051835877600158453279131187530910662656) { return true; }
        if (_pubSignals[5] >= 18446744073709551616) { return true; }
        if (_pubSignals[6] >= 21888242871839275222246405745257275088548364400416034343698204186575808495617) { return true; }
        if (_pubSignals[7] >= 904625697166532776746648320380374280103671755200316906558262375061821325312) { return true; }
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
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
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
}
