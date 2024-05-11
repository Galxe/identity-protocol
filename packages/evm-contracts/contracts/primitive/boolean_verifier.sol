
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

contract BabyZKGroth16BooleanVerifier {
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
    uint256 constant deltax1 = 18281420389139490670240572462309728931069762758666384847478890846556477812965;
    uint256 constant deltax2 = 13401048439837810951017914211936278660216063821494073603722338220435396604496;
    uint256 constant deltay1 = 21202874041022648331698980994305693341595566632225027482785352902129485264727;
    uint256 constant deltay2 = 18936150877052652216308940020674055541483409091516037105694618299681834990474;

    uint256 constant IC0x = 11708618300626501124421915901735889591197446563131571476394569301508043971365;
    uint256 constant IC0y = 5667514267789447089323739319302611763465078048052662562196140462383395872508;
    uint256 constant IC1x = 15195705616700521012127976013459675996720680873721938174087344817064767499959;
    uint256 constant IC1y = 10672412375348497688974862364812884221172587257800457800668811962573422720732;
    uint256 constant IC2x = 4469767714974381441038544382870449937983870305031160934495947295783672104013;
    uint256 constant IC2y = 4361256855208731585297541461256540828791924499734176154562126034217325411934;
    uint256 constant IC3x = 4065007474830663054201212769345725643214519104637863460251326998261224908568;
    uint256 constant IC3y = 6722062532354494177039541269624640687683302797177341622876247091615420138062;
    uint256 constant IC4x = 1608339021418891675882917683154745444281045012507703357182246989049514310802;
    uint256 constant IC4y = 8128620874671164172824065936832829796083958521475019452105747777459375950633;
    uint256 constant IC5x = 5257146532344065012887276372955246831140342551839377880655400784457099064055;
    uint256 constant IC5y = 7978844236199995179937224040162027377080018126978522079920482177471499890762;
    uint256 constant IC6x = 10919099488333612709240051641143996285651554605790292501117844479164219585395;
    uint256 constant IC6y = 635941112977521509791637454846079128545601403436336522285604528441058883176;
    uint256 constant IC7x = 705061730669005706983263006435004752941196689804428750178681337792905619800;
    uint256 constant IC7y = 18860749750051025290426084402442253763575791772481148599856400050650550936756;
    uint256 constant IC8x = 11127748386585527685549602598855629727831492527374704844754329658052519779790;
    uint256 constant IC8y = 21812178917568511189373133106334498782516965982617079750055782729466471342097;
    uint256 constant IC9x = 14606668935673508299530739594649429081565836775860125129151272617815996710514;
    uint256 constant IC9y = 17331858016265809439561525313334479042500557416338688182261061090557648779826;
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    uint16 constant proofLength = 8;
    uint32 constant pubSignalLength = 9;

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
        vks[10] = 18281420389139490670240572462309728931069762758666384847478890846556477812965;
        vks[11] = 13401048439837810951017914211936278660216063821494073603722338220435396604496;
        vks[12] = 21202874041022648331698980994305693341595566632225027482785352902129485264727;
        vks[13] = 18936150877052652216308940020674055541483409091516037105694618299681834990474;
        vks[14] = 11708618300626501124421915901735889591197446563131571476394569301508043971365;
        vks[15] = 5667514267789447089323739319302611763465078048052662562196140462383395872508;
        vks[16] = 15195705616700521012127976013459675996720680873721938174087344817064767499959;
        vks[17] = 10672412375348497688974862364812884221172587257800457800668811962573422720732;
        vks[18] = 4469767714974381441038544382870449937983870305031160934495947295783672104013;
        vks[19] = 4361256855208731585297541461256540828791924499734176154562126034217325411934;
        vks[20] = 4065007474830663054201212769345725643214519104637863460251326998261224908568;
        vks[21] = 6722062532354494177039541269624640687683302797177341622876247091615420138062;
        vks[22] = 1608339021418891675882917683154745444281045012507703357182246989049514310802;
        vks[23] = 8128620874671164172824065936832829796083958521475019452105747777459375950633;
        vks[24] = 5257146532344065012887276372955246831140342551839377880655400784457099064055;
        vks[25] = 7978844236199995179937224040162027377080018126978522079920482177471499890762;
        vks[26] = 10919099488333612709240051641143996285651554605790292501117844479164219585395;
        vks[27] = 635941112977521509791637454846079128545601403436336522285604528441058883176;
        vks[28] = 705061730669005706983263006435004752941196689804428750178681337792905619800;
        vks[29] = 18860749750051025290426084402442253763575791772481148599856400050650550936756;
        vks[30] = 11127748386585527685549602598855629727831492527374704844754329658052519779790;
        vks[31] = 21812178917568511189373133106334498782516965982617079750055782729466471342097;
        vks[32] = 14606668935673508299530739594649429081565836775860125129151272617815996710514;
        vks[33] = 17331858016265809439561525313334479042500557416338688182261061090557648779826;
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
        if (_pubSignals[8] >= 4) { return true; }
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
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
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
