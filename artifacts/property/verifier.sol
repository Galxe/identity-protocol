
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
    uint256 constant deltax1 = 11414308741845866070085426566452317103435919953372480741769117942559358064929;
    uint256 constant deltax2 = 17374122188591355265489391850630525848516844913531328314518114624786540918774;
    uint256 constant deltay1 = 4805943426435892795193533207491585471028169447506182975505804821707709387402;
    uint256 constant deltay2 = 3779852072385966186983736777112504712320379578988346798663720253445993794904;

    uint256 constant IC0x = 21282914606544504841446672183548976667336734118384326986872441490213100233198;
    uint256 constant IC0y = 7244048437405094008788643878823791229689413336569675755260786565615017673008;
    uint256 constant IC1x = 21763052119897271951546724350030855801695388906317992478303308144361455108360;
    uint256 constant IC1y = 1608872978305347168059657251469436932629356088876393997410585169556277214185;
    uint256 constant IC2x = 8003254435902758560853985611657072128887881951452160772919242672441473611036;
    uint256 constant IC2y = 15242606809601150172252505741824596697604315081038945113202486841786263119977;
    uint256 constant IC3x = 18715776049104124383839709405670487216213184446656248593352020123074988458716;
    uint256 constant IC3y = 7887753228505704161087653224279922305694581204716337599935911852199096742082;
    uint256 constant IC4x = 7028110773054326845365750137080078100350298258694196533394851493040606284105;
    uint256 constant IC4y = 8877289167867341027725747071299324574174288751192044206896596093060066561123;
    uint256 constant IC5x = 18260458696454177334207880249354179258160632746613408803694682950372458468206;
    uint256 constant IC5y = 10126634442774700961252304838128483126544953720700398087547427995192566709086;
    uint256 constant IC6x = 9841956294051706864891709641279649298130727235403428423642298228287728688465;
    uint256 constant IC6y = 17527792556901344875361897616626915647320681218054984845236097073487992050734;
    uint256 constant IC7x = 5534428345459510038894105382957122802917358379136265058504320326972661342047;
    uint256 constant IC7y = 6766275239836979735121846401420445341184822174372517830008145522949992864758;
    uint256 constant IC8x = 11113242123452701361566984741890081046161278831617575462222796064073948004605;
    uint256 constant IC8y = 642831114213191244891766047504367930246914717751276308143851811549806736860;
    uint256 constant IC9x = 18527281753934920101755634341734088616055121926321307995214486570920284521957;
    uint256 constant IC9y = 1195297180455881505551214113785314370379730340976398177208182758359244249907;
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
        vks[10] = 11414308741845866070085426566452317103435919953372480741769117942559358064929;
        vks[11] = 17374122188591355265489391850630525848516844913531328314518114624786540918774;
        vks[12] = 4805943426435892795193533207491585471028169447506182975505804821707709387402;
        vks[13] = 3779852072385966186983736777112504712320379578988346798663720253445993794904;
        vks[14] = 21282914606544504841446672183548976667336734118384326986872441490213100233198;
        vks[15] = 7244048437405094008788643878823791229689413336569675755260786565615017673008;
        vks[16] = 21763052119897271951546724350030855801695388906317992478303308144361455108360;
        vks[17] = 1608872978305347168059657251469436932629356088876393997410585169556277214185;
        vks[18] = 8003254435902758560853985611657072128887881951452160772919242672441473611036;
        vks[19] = 15242606809601150172252505741824596697604315081038945113202486841786263119977;
        vks[20] = 18715776049104124383839709405670487216213184446656248593352020123074988458716;
        vks[21] = 7887753228505704161087653224279922305694581204716337599935911852199096742082;
        vks[22] = 7028110773054326845365750137080078100350298258694196533394851493040606284105;
        vks[23] = 8877289167867341027725747071299324574174288751192044206896596093060066561123;
        vks[24] = 18260458696454177334207880249354179258160632746613408803694682950372458468206;
        vks[25] = 10126634442774700961252304838128483126544953720700398087547427995192566709086;
        vks[26] = 9841956294051706864891709641279649298130727235403428423642298228287728688465;
        vks[27] = 17527792556901344875361897616626915647320681218054984845236097073487992050734;
        vks[28] = 5534428345459510038894105382957122802917358379136265058504320326972661342047;
        vks[29] = 6766275239836979735121846401420445341184822174372517830008145522949992864758;
        vks[30] = 11113242123452701361566984741890081046161278831617575462222796064073948004605;
        vks[31] = 642831114213191244891766047504367930246914717751276308143851811549806736860;
        vks[32] = 18527281753934920101755634341734088616055121926321307995214486570920284521957;
        vks[33] = 1195297180455881505551214113785314370379730340976398177208182758359244249907;
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
        if (_pubSignals[8] >= 904625697166532776746648320380374280103671755200316906558262375061821325312) { return true; }
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
