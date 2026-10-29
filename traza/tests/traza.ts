import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Traza } from "../target/types/traza";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("traza", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.traza as Program<Traza>;

  const authority = provider.wallet;
  const producerKeypair = Keypair.generate();
  const factoryKeypair = Keypair.generate();
  const retailerKeypair = Keypair.generate();
  const consumerKeypair = Keypair.generate();

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const roleRegistryPda = (wallet: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("role_registry"), wallet.toBuffer()],
      program.programId
    )[0];

  const pendingRolePda = (wallet: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("pending_role"), wallet.toBuffer()],
      program.programId
    )[0];

  const traceTokenPda = (mint: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("trace_token"), mint.toBuffer()],
      program.programId
    )[0];

  const tokenBalancePda = (mint: PublicKey, owner: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("token_balance"), mint.toBuffer(), owner.toBuffer()],
      program.programId
    )[0];

  const pendingTransferPda = (
    mint: PublicKey,
    from: PublicKey,
    to: PublicKey
  ) =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("pending_transfer"),
        mint.toBuffer(),
        from.toBuffer(),
        to.toBuffer(),
      ],
      program.programId
    )[0];

  const traceEventPda = (mint: PublicKey, index: number) => {
    const indexBuf = Buffer.alloc(4);
    indexBuf.writeUInt32LE(index);
    return PublicKey.findProgramAddressSync(
      [Buffer.from("trace_event"), mint.toBuffer(), indexBuf],
      program.programId
    )[0];
  };

  // certType: 0=Sanitary, 1=Quality, 2=Organic
  const certificatePda = (mint: PublicKey, certType: number) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("certificate"), mint.toBuffer(), Buffer.from([certType])],
      program.programId
    )[0];

  before(async () => {
    for (const wallet of [
      producerKeypair.publicKey,
      factoryKeypair.publicKey,
      retailerKeypair.publicKey,
      consumerKeypair.publicKey,
    ]) {
      const signature = await provider.connection.requestAirdrop(wallet, 1e9);
      const latestBlockhash = await provider.connection.getLatestBlockhash();
      await provider.connection.confirmTransaction({
        signature,
        ...latestBlockhash,
      });
    }
  });

  it("Initialize program", async () => {
    const existingConfig = await provider.connection.getAccountInfo(configPda);
    if (!existingConfig) {
      await program.methods
        .initialize()
        .accounts({
          programConfig: configPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();
    }

    const config = await program.account.programConfig.fetch(configPda);
    expect(config.authority.toString()).to.equal(authority.publicKey.toString());
    expect(config.initialized).to.be.true;
  });

  it("Register and validate Producer role", async () => {
    await program.methods
      .registerRole({ producer: {} })
      .accounts({
        pendingRole: pendingRolePda(producerKeypair.publicKey),
        roleRegistry: roleRegistryPda(producerKeypair.publicKey),
        wallet: producerKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([producerKeypair])
      .rpc();

    await program.methods
      .validateRole()
      .accounts({
        programConfig: configPda,
        pendingRole: pendingRolePda(producerKeypair.publicKey),
        roleRegistry: roleRegistryPda(producerKeypair.publicKey),
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();

    const registry = await program.account.roleRegistry.fetch(
      roleRegistryPda(producerKeypair.publicKey)
    );
    expect(registry.role.producer).to.not.be.undefined;
  });

  it("Register and validate Factory, Retailer, Consumer roles", async () => {
    for (const [kp, role] of [
      [factoryKeypair, { factory: {} }],
      [retailerKeypair, { retailer: {} }],
      [consumerKeypair, { consumer: {} }],
    ] as const) {
      const sig = await provider.connection.requestAirdrop(kp.publicKey, 1e9);
      await provider.connection.confirmTransaction(sig);

      await program.methods
        .registerRole(role)
        .accounts({
          pendingRole: pendingRolePda(kp.publicKey),
          roleRegistry: roleRegistryPda(kp.publicKey),
          wallet: kp.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([kp])
        .rpc();

      await program.methods
        .validateRole()
        .accounts({
          programConfig: configPda,
          pendingRole: pendingRolePda(kp.publicKey),
          roleRegistry: roleRegistryPda(kp.publicKey),
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();
    }
  });

  it("Producer creates token", async () => {
    const mint = Keypair.generate();
    await program.methods
      .createToken(new anchor.BN(100), "Coffee batch 001", "Arabica", "Test Farm", new anchor.BN(0), "Colombia", 1800, null, null, 0, 0)
      .accounts({
        traceToken: traceTokenPda(mint.publicKey),
        creatorBalance: tokenBalancePda(
          mint.publicKey,
          producerKeypair.publicKey
        ),
        mint: mint.publicKey,
        roleRegistry: roleRegistryPda(producerKeypair.publicKey),
        creator: producerKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([producerKeypair, mint])
      .rpc();

    const token = await program.account.traceToken.fetch(
      traceTokenPda(mint.publicKey)
    );
    expect(token.totalSupply.toNumber()).to.equal(100);
    expect(token.creator.toString()).to.equal(
      producerKeypair.publicKey.toString()
    );

    const producerBalance = await program.account.tokenBalance.fetch(
      tokenBalancePda(mint.publicKey, producerKeypair.publicKey)
    );
    expect(producerBalance.balance.toNumber()).to.equal(100);
  });

  it("Full flow: Producer -> Factory -> Retailer -> Consumer", async () => {
    const producerMint = Keypair.generate();
    const factoryMint = Keypair.generate();

    await program.methods
      .createToken(new anchor.BN(50), "Raw beans", "Arabica", "Test Farm", new anchor.BN(0), "Colombia", 1800, null, null, 0, 0)
      .accounts({
        traceToken: traceTokenPda(producerMint.publicKey),
        creatorBalance: tokenBalancePda(
          producerMint.publicKey,
          producerKeypair.publicKey
        ),
        mint: producerMint.publicKey,
        roleRegistry: roleRegistryPda(producerKeypair.publicKey),
        creator: producerKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([producerKeypair, producerMint])
      .rpc();

    await program.methods
      .createToken(new anchor.BN(50), "Roasted coffee", "Blend", "Test Roastery", new anchor.BN(0), "Colombia", 1500, null, null, 0, 0)
      .remainingAccounts([
        {
          pubkey: traceTokenPda(producerMint.publicKey),
          isSigner: false,
          isWritable: false,
        },
      ])
      .accounts({
        traceToken: traceTokenPda(factoryMint.publicKey),
        creatorBalance: tokenBalancePda(
          factoryMint.publicKey,
          factoryKeypair.publicKey
        ),
        mint: factoryMint.publicKey,
        roleRegistry: roleRegistryPda(factoryKeypair.publicKey),
        creator: factoryKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([factoryKeypair, factoryMint])
      .rpc();

    await program.methods
      .initiateTransfer(new anchor.BN(50))
      .accounts({
        traceToken: traceTokenPda(factoryMint.publicKey),
        fromBalance: tokenBalancePda(
          factoryMint.publicKey,
          factoryKeypair.publicKey
        ),
        pendingTransfer: pendingTransferPda(
          factoryMint.publicKey,
          factoryKeypair.publicKey,
          retailerKeypair.publicKey
        ),
        fromRoleRegistry: roleRegistryPda(factoryKeypair.publicKey),
        to: retailerKeypair.publicKey,
        toRoleRegistry: roleRegistryPda(retailerKeypair.publicKey),
        from: factoryKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([factoryKeypair])
      .rpc();

    await program.methods
      .acceptTransfer()
      .accounts({
        traceToken: traceTokenPda(factoryMint.publicKey),
        pendingTransfer: pendingTransferPda(
          factoryMint.publicKey,
          factoryKeypair.publicKey,
          retailerKeypair.publicKey
        ),
        fromBalance: tokenBalancePda(
          factoryMint.publicKey,
          factoryKeypair.publicKey
        ),
        toBalance: tokenBalancePda(
          factoryMint.publicKey,
          retailerKeypair.publicKey
        ),
        roleRegistry: roleRegistryPda(retailerKeypair.publicKey),
        to: retailerKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([retailerKeypair])
      .rpc();

    let factoryBalance = await program.account.tokenBalance.fetch(
      tokenBalancePda(factoryMint.publicKey, factoryKeypair.publicKey)
    );
    let retailerBalance = await program.account.tokenBalance.fetch(
      tokenBalancePda(factoryMint.publicKey, retailerKeypair.publicKey)
    );
    expect(factoryBalance.balance.toNumber()).to.equal(0);
    expect(retailerBalance.balance.toNumber()).to.equal(50);

    await program.methods
      .initiateTransfer(new anchor.BN(50))
      .accounts({
        traceToken: traceTokenPda(factoryMint.publicKey),
        fromBalance: tokenBalancePda(
          factoryMint.publicKey,
          retailerKeypair.publicKey
        ),
        pendingTransfer: pendingTransferPda(
          factoryMint.publicKey,
          retailerKeypair.publicKey,
          consumerKeypair.publicKey
        ),
        fromRoleRegistry: roleRegistryPda(retailerKeypair.publicKey),
        to: consumerKeypair.publicKey,
        toRoleRegistry: roleRegistryPda(consumerKeypair.publicKey),
        from: retailerKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([retailerKeypair])
      .rpc();

    await program.methods
      .acceptTransfer()
      .accounts({
        traceToken: traceTokenPda(factoryMint.publicKey),
        pendingTransfer: pendingTransferPda(
          factoryMint.publicKey,
          retailerKeypair.publicKey,
          consumerKeypair.publicKey
        ),
        fromBalance: tokenBalancePda(
          factoryMint.publicKey,
          retailerKeypair.publicKey
        ),
        toBalance: tokenBalancePda(
          factoryMint.publicKey,
          consumerKeypair.publicKey
        ),
        roleRegistry: roleRegistryPda(consumerKeypair.publicKey),
        to: consumerKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([consumerKeypair])
      .rpc();

    retailerBalance = await program.account.tokenBalance.fetch(
      tokenBalancePda(factoryMint.publicKey, retailerKeypair.publicKey)
    );
    const consumerBalance = await program.account.tokenBalance.fetch(
      tokenBalancePda(factoryMint.publicKey, consumerKeypair.publicKey)
    );
    expect(retailerBalance.balance.toNumber()).to.equal(0);
    expect(consumerBalance.balance.toNumber()).to.equal(50);
  });

  describe("Oracle temperature/humidity tests", () => {
    const oracleMint = Keypair.generate();

    it("token with non-zero lat/lon has oracle_verified=true", async () => {
      await program.methods
        .createToken(
          new anchor.BN(10),
          "Oracle Test Token",
          "Arabica",
          "Test Farm",
          new anchor.BN(0),
          "Colombia",
          1500,
          25,
          70,
          4.6111,
          -74.0833
        )
        .accounts({
          traceToken: traceTokenPda(oracleMint.publicKey),
          creatorBalance: tokenBalancePda(oracleMint.publicKey, producerKeypair.publicKey),
          mint: oracleMint.publicKey,
          roleRegistry: roleRegistryPda(producerKeypair.publicKey),
          creator: producerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([producerKeypair, oracleMint])
        .rpc();

      const token = await program.account.traceToken.fetch(traceTokenPda(oracleMint.publicKey));
      expect(token.oracleVerified).to.be.true;
      expect(token.temperature).to.equal(25);
      expect(token.humidity).to.equal(70);
    });

    it("token with zero lat/lon has oracle_verified=false", async () => {
      const noOracleMint = Keypair.generate();
      await program.methods
        .createToken(
          new anchor.BN(10),
          "No Oracle Token",
          "Robusta",
          "Test Farm",
          new anchor.BN(0),
          "Brazil",
          800,
          30,
          80,
          0,
          0
        )
        .accounts({
          traceToken: traceTokenPda(noOracleMint.publicKey),
          creatorBalance: tokenBalancePda(noOracleMint.publicKey, producerKeypair.publicKey),
          mint: noOracleMint.publicKey,
          roleRegistry: roleRegistryPda(producerKeypair.publicKey),
          creator: producerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([producerKeypair, noOracleMint])
        .rpc();

      const token = await program.account.traceToken.fetch(traceTokenPda(noOracleMint.publicKey));
      expect(token.oracleVerified).to.be.false;
      expect(token.temperature).to.equal(30);
      expect(token.humidity).to.equal(80);
    });

    it("trace event stores temp/humidity correctly", async () => {
      const eventMint = Keypair.generate();
      await program.methods
        .createToken(
          new anchor.BN(5),
          "Event Test",
          "Arabica",
          "Farm",
          new anchor.BN(0),
          "Colombia",
          1000,
          null,
          null,
          0,
          0
        )
        .accounts({
          traceToken: traceTokenPda(eventMint.publicKey),
          creatorBalance: tokenBalancePda(eventMint.publicKey, producerKeypair.publicKey),
          mint: eventMint.publicKey,
          roleRegistry: roleRegistryPda(producerKeypair.publicKey),
          creator: producerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([producerKeypair, eventMint])
        .rpc();

      await program.methods
        .addTraceEvent(
          { harvest: {} },
          "Harvest with temp/humidity",
          18,
          62,
          0
        )
        .accounts({
          traceToken: traceTokenPda(eventMint.publicKey),
          recorderBalance: tokenBalancePda(eventMint.publicKey, producerKeypair.publicKey),
          traceEvent: traceEventPda(eventMint.publicKey, 0),
          roleRegistry: roleRegistryPda(producerKeypair.publicKey),
          recorder: producerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([producerKeypair])
        .rpc();

      const event = await program.account.traceEvent.fetch(traceEventPda(eventMint.publicKey, 0));
      expect(event.temperature).to.equal(18);
      expect(event.humidity).to.equal(62);
    });
  });

  describe("Coffee domain extensions", () => {
    const coffeeMint = Keypair.generate();
    let eventCount = 0;

    it("creates coffee token with farm metadata", async () => {
      await program.methods
        .createToken(
          new anchor.BN(100),
          "Organic Coffee Lot 001",
          "Arabica",
          "La Esperanza Farm",
          new anchor.BN(1700000000),
          "Colombia",
          1800,
          22,
          65,
          2.5359,
          -75.5277
        )
        .accounts({
          traceToken: traceTokenPda(coffeeMint.publicKey),
          creatorBalance: tokenBalancePda(coffeeMint.publicKey, producerKeypair.publicKey),
          mint: coffeeMint.publicKey,
          roleRegistry: roleRegistryPda(producerKeypair.publicKey),
          creator: producerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([producerKeypair, coffeeMint])
        .rpc();

      const token = await program.account.traceToken.fetch(traceTokenPda(coffeeMint.publicKey));
      expect(token.coffeeType).to.equal("Arabica");
      expect(token.farmName).to.equal("La Esperanza Farm");
      expect(token.originCountry).to.equal("Colombia");
      expect(token.altitudeMeters).to.equal(1800);
      expect(token.temperature).to.equal(22);
      expect(token.humidity).to.equal(65);
      expect(token.eventCount).to.equal(0);
    });

    it("factory creates processed token from producer source", async () => {
      const factoryProcessMint = Keypair.generate();
      await program.methods
        .createToken(
          new anchor.BN(80),
          "Premium Roasted Coffee",
          "Roasted",
          "Central Roastery",
          new anchor.BN(0),
          "Colombia",
          0,
          null,
          null,
          0,
          0
        )
        .remainingAccounts([{
          pubkey: traceTokenPda(coffeeMint.publicKey),
          isSigner: false,
          isWritable: false,
        }])
        .accounts({
          traceToken: traceTokenPda(factoryProcessMint.publicKey),
          creatorBalance: tokenBalancePda(factoryProcessMint.publicKey, factoryKeypair.publicKey),
          mint: factoryProcessMint.publicKey,
          roleRegistry: roleRegistryPda(factoryKeypair.publicKey),
          creator: factoryKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([factoryKeypair, factoryProcessMint])
        .rpc();

      const token = await program.account.traceToken.fetch(traceTokenPda(factoryProcessMint.publicKey));
      expect(token.sourceTokens.length).to.equal(1);
      expect(token.sourceTokens[0].toString()).to.equal(coffeeMint.publicKey.toString());
      expect(token.coffeeType).to.equal("Roasted");
    });

    it("adds harvest event to token", async () => {
      const index = eventCount;
      await program.methods
        .addTraceEvent(
          { harvest: {} },
          "Hand harvest completed at La Esperanza farm",
          22,
          65,
          index
        )
        .accounts({
          traceToken: traceTokenPda(coffeeMint.publicKey),
          recorderBalance: tokenBalancePda(coffeeMint.publicKey, producerKeypair.publicKey),
          traceEvent: traceEventPda(coffeeMint.publicKey, index),
          roleRegistry: roleRegistryPda(producerKeypair.publicKey),
          recorder: producerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([producerKeypair])
        .rpc();

      const event = await program.account.traceEvent.fetch(traceEventPda(coffeeMint.publicKey, index));
      expect(event.description).to.equal("Hand harvest completed at La Esperanza farm");
      expect(event.index).to.equal(0);
      expect(event.temperature).to.equal(22);
      expect(event.humidity).to.equal(65);

      const token = await program.account.traceToken.fetch(traceTokenPda(coffeeMint.publicKey));
      expect(token.eventCount).to.equal(1);
      eventCount++;
    });

    it("adds processing event and event_count increments correctly", async () => {
      const index = eventCount;
      await program.methods
        .addTraceEvent(
          { processing: {} },
          "Wet processing completed",
          null,
          null,
          index
        )
        .accounts({
          traceToken: traceTokenPda(coffeeMint.publicKey),
          recorderBalance: tokenBalancePda(coffeeMint.publicKey, producerKeypair.publicKey),
          traceEvent: traceEventPda(coffeeMint.publicKey, index),
          roleRegistry: roleRegistryPda(producerKeypair.publicKey),
          recorder: producerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([producerKeypair])
        .rpc();

      const event = await program.account.traceEvent.fetch(traceEventPda(coffeeMint.publicKey, index));
      expect(event.index).to.equal(1);
      expect(event.temperature).to.be.null;

      const token = await program.account.traceToken.fetch(traceTokenPda(coffeeMint.publicKey));
      expect(token.eventCount).to.equal(2);
      eventCount++;
    });

    it("producer requests organic certificate", async () => {
      await program.methods
        .requestCertificate(
          { organic: {} },
          "Farm pesticide-free since 2020. Documentation attached."
        )
        .accounts({
          traceToken: traceTokenPda(coffeeMint.publicKey),
          requesterBalance: tokenBalancePda(coffeeMint.publicKey, producerKeypair.publicKey),
          certificate: certificatePda(coffeeMint.publicKey, 2),
          roleRegistry: roleRegistryPda(producerKeypair.publicKey),
          programConfig: configPda,
          requester: producerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([producerKeypair])
        .rpc();

      const cert = await program.account.certificate.fetch(certificatePda(coffeeMint.publicKey, 2));
      expect(cert.status.pending).to.not.be.undefined;
      expect(cert.notes).to.include("pesticide");
      expect(cert.resolvedAt).to.be.null;
    });

    it("authority approves certificate", async () => {
      await program.methods
        .resolveCertificate(
          { organic: {} },
          true,
          "Documentation verified. Organic certificate approved."
        )
        .accounts({
          certificate: certificatePda(coffeeMint.publicKey, 2),
          programConfig: configPda,
          authority: authority.publicKey,
        } as any)
        .rpc();

      const cert = await program.account.certificate.fetch(certificatePda(coffeeMint.publicKey, 2));
      expect(cert.status.approved).to.not.be.undefined;
      expect(cert.resolvedAt).to.not.be.null;
      expect(cert.notes).to.include("approved");
    });

    it("authority rejects certificate with notes", async () => {
      await program.methods
        .requestCertificate({ quality: {} }, "Premium quality certificate request")
        .accounts({
          traceToken: traceTokenPda(coffeeMint.publicKey),
          requesterBalance: tokenBalancePda(coffeeMint.publicKey, producerKeypair.publicKey),
          certificate: certificatePda(coffeeMint.publicKey, 1),
          roleRegistry: roleRegistryPda(producerKeypair.publicKey),
          programConfig: configPda,
          requester: producerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([producerKeypair])
        .rpc();

      await program.methods
        .resolveCertificate({ quality: {} }, false, "Sample too small for quality assessment.")
        .accounts({
          certificate: certificatePda(coffeeMint.publicKey, 1),
          programConfig: configPda,
          authority: authority.publicKey,
        } as any)
        .rpc();

      const cert = await program.account.certificate.fetch(certificatePda(coffeeMint.publicKey, 1));
      expect(cert.status.rejected).to.not.be.undefined;
      expect(cert.notes).to.include("Sample");
      expect(cert.resolvedAt).to.not.be.null;
    });

    it("prevents non-authority from resolving certificate", async () => {
      await program.methods
        .requestCertificate({ sanitary: {} }, "Test health certificate request")
        .accounts({
          traceToken: traceTokenPda(coffeeMint.publicKey),
          requesterBalance: tokenBalancePda(coffeeMint.publicKey, producerKeypair.publicKey),
          certificate: certificatePda(coffeeMint.publicKey, 0),
          roleRegistry: roleRegistryPda(producerKeypair.publicKey),
          programConfig: configPda,
          requester: producerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([producerKeypair])
        .rpc();

      try {
        await program.methods
          .resolveCertificate({ sanitary: {} }, true, "Approved")
          .accounts({
            certificate: certificatePda(coffeeMint.publicKey, 0),
            programConfig: configPda,
            authority: producerKeypair.publicKey,
          } as any)
          .signers([producerKeypair])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        const msg = err?.error?.errorCode?.code ?? err?.message ?? "";
        expect(msg).to.match(/UnauthorizedCertifier|unauthorized/i);
      }
    });

    it("prevents duplicate certificate of same type", async () => {
      // The organic certificate already exists and is approved — init must fail
      try {
        await program.methods
          .requestCertificate({ organic: {} }, "Second organic attempt")
          .accounts({
            traceToken: traceTokenPda(coffeeMint.publicKey),
            requesterBalance: tokenBalancePda(coffeeMint.publicKey, producerKeypair.publicKey),
            certificate: certificatePda(coffeeMint.publicKey, 2),
            roleRegistry: roleRegistryPda(producerKeypair.publicKey),
            programConfig: configPda,
            requester: producerKeypair.publicKey,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([producerKeypair])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        // The account already exists → init fails with an Anchor error
        expect(err).to.exist;
      }
    });

    it("prevents event on token without balance", async () => {
      const noBalanceMint = Keypair.generate();
      await program.methods
        .createToken(new anchor.BN(10), "Token sin balance", "Arabica", "Test Farm", new anchor.BN(0), "Colombia", 0, null, null, 0, 0)
        .accounts({
          traceToken: traceTokenPda(noBalanceMint.publicKey),
          creatorBalance: tokenBalancePda(noBalanceMint.publicKey, producerKeypair.publicKey),
          mint: noBalanceMint.publicKey,
          roleRegistry: roleRegistryPda(producerKeypair.publicKey),
          creator: producerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([producerKeypair, noBalanceMint])
        .rpc();

      // retailerKeypair has no balance in this token → must fail
      try {
        await program.methods
          .addTraceEvent({ harvest: {} }, "Attempt without balance", null, null, 0)
          .accounts({
            traceToken: traceTokenPda(noBalanceMint.publicKey),
            recorderBalance: tokenBalancePda(noBalanceMint.publicKey, retailerKeypair.publicKey),
            traceEvent: traceEventPda(noBalanceMint.publicKey, 0),
            roleRegistry: roleRegistryPda(retailerKeypair.publicKey),
            recorder: retailerKeypair.publicKey,
            systemProgram: SystemProgram.programId,
          } as any)
          .signers([retailerKeypair])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err).to.exist;
      }
    });
  });
});
