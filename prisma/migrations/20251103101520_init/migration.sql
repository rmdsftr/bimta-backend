-- CreateEnum
CREATE TYPE "public"."jenis_bimbingan_enum" AS ENUM ('offline', 'online');

-- CreateEnum
CREATE TYPE "public"."role_enum" AS ENUM ('mahasiswa', 'dosen', 'admin');

-- CreateEnum
CREATE TYPE "public"."status_bimbingan_enum" AS ENUM ('ongoing', 'done', 'warning', 'terminated');

-- CreateEnum
CREATE TYPE "public"."status_jadwal_enum" AS ENUM ('waiting', 'accepted', 'declined', 'done');

-- CreateEnum
CREATE TYPE "public"."status_progress_enum" AS ENUM ('unread', 'read', 'need_revision', 'done');

-- CreateEnum
CREATE TYPE "public"."status_user_enum" AS ENUM ('active', 'inactive');

-- CreateTable
CREATE TABLE "public"."bimbingan" (
    "bimbingan_id" VARCHAR(255) NOT NULL,
    "dosen_id" VARCHAR(100) NOT NULL,
    "mahasiswa_id" VARCHAR(100) NOT NULL,
    "status_bimbingan" "public"."status_bimbingan_enum" NOT NULL,
    "total_bimbingan" INTEGER NOT NULL,

    CONSTRAINT "bimbingan_pkey" PRIMARY KEY ("bimbingan_id")
);

-- CreateTable
CREATE TABLE "public"."jadwal" (
    "bimbingan_id" VARCHAR(255) NOT NULL,
    "datetime" TIMESTAMP(6) NOT NULL,
    "lokasi" TEXT NOT NULL,
    "note_mahasiswa" TEXT NOT NULL,
    "note_dosen" TEXT,
    "status_jadwal" "public"."status_jadwal_enum" NOT NULL,
    "judul_pertemuan" VARCHAR(255),

    CONSTRAINT "jadwal_pkey" PRIMARY KEY ("bimbingan_id","datetime")
);

-- CreateTable
CREATE TABLE "public"."progress" (
    "progress_id" VARCHAR(255) NOT NULL,
    "bimbingan_id" VARCHAR(255) NOT NULL,
    "datetime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subject_progress" VARCHAR(255) NOT NULL,
    "file_progress" TEXT NOT NULL,
    "submit_at" TIMESTAMPTZ(6) NOT NULL,
    "file_koreksi" TEXT,
    "koreksi_at" TIMESTAMP(6),
    "evaluasi_dosen" TEXT,
    "note_mahasiswa" TEXT,
    "status_progress" "public"."status_progress_enum" NOT NULL,
    "jenis_bimbingan" "public"."jenis_bimbingan_enum" NOT NULL,
    "revisi_number" INTEGER NOT NULL,
    "parent_progress_id" VARCHAR(255),
    "file_name" VARCHAR(255),

    CONSTRAINT "progress_pkey" PRIMARY KEY ("progress_id")
);

-- CreateTable
CREATE TABLE "public"."referensi_ta" (
    "nim_mahasiswa" VARCHAR(25) NOT NULL,
    "nama_mahasiswa" VARCHAR(255) NOT NULL,
    "judul" VARCHAR(255) NOT NULL,
    "doc_url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "topik" VARCHAR(100),
    "tahun" INTEGER,

    CONSTRAINT "referensi_ta_pkey" PRIMARY KEY ("nim_mahasiswa")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "user_id" VARCHAR(100) NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "no_whatsapp" VARCHAR(25) NOT NULL,
    "sandi" VARCHAR(255) NOT NULL,
    "role" "public"."role_enum" NOT NULL,
    "photo_url" TEXT,
    "status_user" "public"."status_user_enum" NOT NULL,
    "created_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6),
    "judul" VARCHAR(255),
    "judul_temp" VARCHAR(255),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."jadwal_dosen" (
    "jadwal_dosen_id" VARCHAR(255) NOT NULL,
    "dosen_id" VARCHAR(100) NOT NULL,
    "tanggal" DATE NOT NULL,
    "kegiatan" VARCHAR(255),
    "jam_mulai" TIME(6),
    "jam_selesai" TIME(6),

    CONSTRAINT "jadwal_dosen_pkey" PRIMARY KEY ("jadwal_dosen_id")
);

-- AddForeignKey
ALTER TABLE "public"."bimbingan" ADD CONSTRAINT "bimbingan_dosen_id_fkey" FOREIGN KEY ("dosen_id") REFERENCES "public"."users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."bimbingan" ADD CONSTRAINT "bimbingan_mahasiswa_id_fkey" FOREIGN KEY ("mahasiswa_id") REFERENCES "public"."users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."jadwal" ADD CONSTRAINT "jadwal_bimbingan_id_fkey" FOREIGN KEY ("bimbingan_id") REFERENCES "public"."bimbingan"("bimbingan_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."progress" ADD CONSTRAINT "progress_bimbingan_id_fkey" FOREIGN KEY ("bimbingan_id") REFERENCES "public"."bimbingan"("bimbingan_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."progress" ADD CONSTRAINT "progress_parent_progress_id_fkey" FOREIGN KEY ("parent_progress_id") REFERENCES "public"."progress"("progress_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."jadwal_dosen" ADD CONSTRAINT "fk_dosen" FOREIGN KEY ("dosen_id") REFERENCES "public"."users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
