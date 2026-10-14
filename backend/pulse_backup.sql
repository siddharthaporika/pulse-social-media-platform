-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: pulse
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `admin_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHashed` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `Admin_email_key` (`email`),
  KEY `Admin_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blocks`
--

DROP TABLE IF EXISTS `blocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blocks` (
  `blockerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `blockedId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`blockerId`,`blockedId`),
  KEY `Blocks_blockerId_idx` (`blockerId`),
  KEY `Blocks_blockedId_idx` (`blockedId`),
  CONSTRAINT `Blocks_blockedId_fkey` FOREIGN KEY (`blockedId`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Blocks_blockerId_fkey` FOREIGN KEY (`blockerId`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blocks`
--

LOCK TABLES `blocks` WRITE;
/*!40000 ALTER TABLE `blocks` DISABLE KEYS */;
/*!40000 ALTER TABLE `blocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comment`
--

DROP TABLE IF EXISTS `comment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comment` (
  `comment_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `post_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_cmtid` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`comment_id`),
  KEY `Comment_post_id_idx` (`post_id`),
  KEY `Comment_user_id_idx` (`user_id`),
  KEY `Comment_parent_cmtid_idx` (`parent_cmtid`),
  KEY `Comment_createdAt_idx` (`createdAt`),
  CONSTRAINT `Comment_parent_cmtid_fkey` FOREIGN KEY (`parent_cmtid`) REFERENCES `comment` (`comment_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Comment_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `post` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Comment_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comment`
--

LOCK TABLES `comment` WRITE;
/*!40000 ALTER TABLE `comment` DISABLE KEYS */;
INSERT INTO `comment` VALUES ('cmhsyseia0001wvr07mcrcea2','hi','2025-11-10 09:53:14.865','2025-11-10 09:53:14.865','cmhhafagx0002wvd0t25fpkjz','cmhh8zmts0000wv6cnbbv1ifa',NULL),('cmhsyslhu0003wvr0i6z55bkp','hlo','2025-11-10 09:53:23.922','2025-11-10 09:53:23.922','cmhhafagx0002wvd0t25fpkjz','cmhh8zmts0000wv6cnbbv1ifa',NULL),('cmhsyt58e0005wvr0iugfg6lz','vbnjkl','2025-11-10 09:53:49.502','2025-11-10 09:53:49.502','cmhhafagx0002wvd0t25fpkjz','cmhh8zmts0000wv6cnbbv1ifa',NULL),('cmhsz0u3e0001wvtouvo3jgwe','messi','2025-11-10 09:59:48.313','2025-11-10 09:59:48.313','cmhhafagx0002wvd0t25fpkjz','cmhh8zmts0000wv6cnbbv1ifa',NULL),('cmhszmn640002wvjss0qjsf36','hlo','2025-11-10 10:16:45.772','2025-11-10 10:16:45.772','cmhhafagx0002wvd0t25fpkjz','cmhszi1ga0000wvjs55z3cbl7','cmhsyseia0001wvr07mcrcea2'),('cmi0yd6ez0002wvaok1y1xgoa','bro','2025-11-16 00:03:33.947','2025-11-16 00:03:33.947','cmhhafagx0002wvd0t25fpkjz','cmi0yc1rv0000wvao8xypmkig','cmhsz0u3e0001wvtouvo3jgwe'),('cmi0yiwk20004wvaonjaqfk8l','hlo','2025-11-16 00:08:01.106','2025-11-16 00:08:01.106','cmhhafagx0002wvd0t25fpkjz','cmhh8zmts0000wv6cnbbv1ifa',NULL),('cmi1d8rus0006wvaou8ihbnpa','bro','2025-11-16 07:00:02.692','2025-11-16 07:00:02.692','cmhhafagx0002wvd0t25fpkjz','cmhh8zmts0000wv6cnbbv1ifa',NULL),('cmi1d96xq0008wvao7hh96g3z','wassup','2025-11-16 07:00:22.238','2025-11-16 07:00:22.238','cmhhafagx0002wvd0t25fpkjz','cmi0yc1rv0000wvao8xypmkig','cmi1d8rus0006wvaou8ihbnpa'),('cmi1e97e70001wvbgc2bsmqbr','asd','2025-11-16 07:28:22.447','2025-11-16 07:28:22.447','cmhhafagx0002wvd0t25fpkjz','cmhh8zmts0000wv6cnbbv1ifa',NULL),('cmi1e9ek30003wvbg2f12z7p5','yyff','2025-11-16 07:28:31.731','2025-11-16 07:28:31.731','cmhhafagx0002wvd0t25fpkjz','cmi0yc1rv0000wvao8xypmkig','cmi1e97e70001wvbgc2bsmqbr'),('cmi1ejbo10001wv54z5ti613t','imk','2025-11-16 07:36:14.545','2025-11-16 07:36:14.545','cmhhafagx0002wvd0t25fpkjz','cmhh8zmts0000wv6cnbbv1ifa',NULL),('cmi1ejiiu0003wv54s3ik38zj','kudo','2025-11-16 07:36:23.431','2025-11-16 07:36:23.431','cmhhafagx0002wvd0t25fpkjz','cmi0yc1rv0000wvao8xypmkig','cmi1ejbo10001wv54z5ti613t'),('cmi1j37530005wvncgtpa63r6','hi','2025-11-16 09:43:40.262','2025-11-16 09:43:40.262','cmhhafagx0002wvd0t25fpkjz','cmi0yc1rv0000wvao8xypmkig',NULL),('cmi1j3la80007wvncelpplx3w','bu','2025-11-16 09:43:58.591','2025-11-16 09:43:58.591','cmhhafagx0002wvd0t25fpkjz','cmi0yc1rv0000wvao8xypmkig','cmi1j37530005wvncgtpa63r6'),('cmi2etpx80001wv9w2ctg7pu8','hievbnhj','2025-11-17 00:32:05.755','2025-11-17 00:32:05.755','cmhhafagx0002wvd0t25fpkjz','cmhh8zmts0000wv6cnbbv1ifa',NULL),('cmi2ety0v0003wv9w3wifvd7y','xcvbnm','2025-11-17 00:32:16.255','2025-11-17 00:32:16.255','cmhhafagx0002wvd0t25fpkjz','cmi0yc1rv0000wvao8xypmkig','cmi2etpx80001wv9w2ctg7pu8');
/*!40000 ALTER TABLE `comment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `followrequest`
--

DROP TABLE IF EXISTS `followrequest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `followrequest` (
  `fr_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requester_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`fr_id`),
  UNIQUE KEY `FollowRequest_requester_id_target_id_key` (`requester_id`,`target_id`),
  KEY `FollowRequest_target_id_status_idx` (`target_id`,`status`),
  CONSTRAINT `FollowRequest_requester_id_fkey` FOREIGN KEY (`requester_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FollowRequest_target_id_fkey` FOREIGN KEY (`target_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `followrequest`
--

LOCK TABLES `followrequest` WRITE;
/*!40000 ALTER TABLE `followrequest` DISABLE KEYS */;
/*!40000 ALTER TABLE `followrequest` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `follows`
--

DROP TABLE IF EXISTS `follows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `follows` (
  `followerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `followingId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`followerId`,`followingId`),
  KEY `Follows_followerId_idx` (`followerId`),
  KEY `Follows_followingId_idx` (`followingId`),
  KEY `Follows_createdAt_idx` (`createdAt`),
  CONSTRAINT `Follows_followerId_fkey` FOREIGN KEY (`followerId`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Follows_followingId_fkey` FOREIGN KEY (`followingId`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `follows`
--

LOCK TABLES `follows` WRITE;
/*!40000 ALTER TABLE `follows` DISABLE KEYS */;
INSERT INTO `follows` VALUES ('cmi0yc1rv0000wvao8xypmkig','cmhhafagl0000wvd08ifjuhs0','2025-11-16 09:36:33.635'),('cmi0yc1rv0000wvao8xypmkig','cmhh8zmts0000wv6cnbbv1ifa','2025-11-17 03:16:36.648'),('cmi2pdh320000wvv4f33rxluk','cmhh8zmts0000wv6cnbbv1ifa','2025-11-17 08:25:07.728');
/*!40000 ALTER TABLE `follows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `like`
--

DROP TABLE IF EXISTS `like`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `like` (
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `post_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`,`post_id`),
  KEY `Like_user_id_idx` (`user_id`),
  KEY `Like_post_id_idx` (`post_id`),
  CONSTRAINT `Like_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `post` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Like_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `like`
--

LOCK TABLES `like` WRITE;
/*!40000 ALTER TABLE `like` DISABLE KEYS */;
INSERT INTO `like` VALUES ('cmhh8zmts0000wv6cnbbv1ifa','cmhhafagx0002wvd0t25fpkjz','2025-11-15 23:58:35.924'),('cmhszi1ga0000wvjs55z3cbl7','cmhhafagx0002wvd0t25fpkjz','2025-11-10 11:05:32.566'),('cmi0yc1rv0000wvao8xypmkig','cmhhafagx0002wvd0t25fpkjz','2025-11-16 00:09:08.012');
/*!40000 ALTER TABLE `like` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message`
--

DROP TABLE IF EXISTS `message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message` (
  `message_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `media_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `post_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sent_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `sender_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receiver_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`message_id`),
  KEY `Message_sender_id_idx` (`sender_id`),
  KEY `Message_receiver_id_idx` (`receiver_id`),
  KEY `Message_sent_at_idx` (`sent_at`),
  KEY `Message_post_id_fkey` (`post_id`),
  CONSTRAINT `Message_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `post` (`post_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Message_receiver_id_fkey` FOREIGN KEY (`receiver_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Message_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message`
--

LOCK TABLES `message` WRITE;
/*!40000 ALTER TABLE `message` DISABLE KEYS */;
INSERT INTO `message` VALUES ('cmi1jfj4k000bwvnci8okr0wl','hi',NULL,NULL,'2025-11-16 09:53:15.668','2025-11-16 09:53:15.668','cmi0yc1rv0000wvao8xypmkig','cmhhafagl0000wvd08ifjuhs0'),('cmi1jfxik000dwvnc4sotwci8','hlo',NULL,NULL,'2025-11-16 09:53:34.315','2025-11-16 09:53:34.315','cmhh8zmts0000wv6cnbbv1ifa','cmi0yc1rv0000wvao8xypmkig'),('cmi1jg9fv000fwvnctvj0kbrj','bye',NULL,NULL,'2025-11-16 09:53:49.770','2025-11-16 09:53:49.770','cmhh8zmts0000wv6cnbbv1ifa','cmi0yc1rv0000wvao8xypmkig'),('cmi1jgrrb000hwvncgxb1s7wy','hi',NULL,NULL,'2025-11-16 09:54:13.509','2025-11-16 09:54:13.509','cmhh8zmts0000wv6cnbbv1ifa','cmi0yc1rv0000wvao8xypmkig'),('cmi1jgye0000jwvnc5tclicqr','what\'s popping',NULL,NULL,'2025-11-16 09:54:22.104','2025-11-16 09:54:22.104','cmi0yc1rv0000wvao8xypmkig','cmhh8zmts0000wv6cnbbv1ifa'),('cmi1jhj6t000lwvncsdi6fhlb','modda guduv',NULL,NULL,'2025-11-16 09:54:49.059','2025-11-16 09:54:49.059','cmhh8zmts0000wv6cnbbv1ifa','cmi0yc1rv0000wvao8xypmkig'),('cmi1ji3q8000nwvnctdakrq6t','fucking bitch',NULL,NULL,'2025-11-16 09:55:15.680','2025-11-16 09:55:15.680','cmi0yc1rv0000wvao8xypmkig','cmhhafags0001wvd0y77zbwhm'),('cmi1ji82y000pwvnc58qj6gwc','jbdviubviuaerbv e',NULL,NULL,'2025-11-16 09:55:21.321','2025-11-16 09:55:21.321','cmi0yc1rv0000wvao8xypmkig','cmhhafags0001wvd0y77zbwhm'),('cmi1jiasn000rwvncl2vxo0uk','yiorbfiwueEBVUAWERBVGQEURIO',NULL,NULL,'2025-11-16 09:55:24.837','2025-11-16 09:55:24.837','cmi0yc1rv0000wvao8xypmkig','cmhhafags0001wvd0y77zbwhm'),('cmi1jz9hy000twvnc81ax0pdc','hello',NULL,NULL,'2025-11-16 10:08:36.303','2025-11-16 10:08:36.303','cmhh8zmts0000wv6cnbbv1ifa','cmi0yc1rv0000wvao8xypmkig'),('cmi2eudon0005wv9wt54717wi','cvbn',NULL,NULL,'2025-11-17 00:32:36.551','2025-11-17 00:32:36.551','cmi0yc1rv0000wvao8xypmkig','cmhh8zmts0000wv6cnbbv1ifa'),('cmi2ihvjr0007wvzo2i0598ws','cs',NULL,NULL,'2025-11-17 02:14:51.639','2025-11-17 02:14:51.639','cmhh8zmts0000wv6cnbbv1ifa','cmi0yc1rv0000wvao8xypmkig'),('cmi2ihy5q0009wvzopjr66dgq','scvbnm',NULL,NULL,'2025-11-17 02:14:55.021','2025-11-17 02:14:55.021','cmi0yc1rv0000wvao8xypmkig','cmhh8zmts0000wv6cnbbv1ifa'),('cmi2iicut000bwvzoffr07505','dfghsjk',NULL,NULL,'2025-11-17 02:15:14.068','2025-11-17 02:15:14.068','cmi0yc1rv0000wvao8xypmkig','cmhh8zmts0000wv6cnbbv1ifa'),('cmi2jpomy0001wvg0l3dys52f',NULL,NULL,'cmi2hxqpw0001wvzo3073azjd','2025-11-17 02:48:55.531','2025-11-17 02:48:55.531','cmi0yc1rv0000wvao8xypmkig','cmhh8zmts0000wv6cnbbv1ifa'),('cmi2ksej70001wvycv94g5hhj',NULL,NULL,'cmhhafagx0003wvd0kqf36c2m','2025-11-17 03:19:02.035','2025-11-17 03:19:02.035','cmi0yc1rv0000wvao8xypmkig','cmhh8zmts0000wv6cnbbv1ifa'),('cmi2vh79n000cwvv45zrirnda',NULL,NULL,'cmi2tfm96000awvv4kurf1xmt','2025-11-17 08:18:15.176','2025-11-17 08:18:15.176','cmi2pdh320000wvv4f33rxluk','cmhh8zmts0000wv6cnbbv1ifa');
/*!40000 ALTER TABLE `message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post`
--

DROP TABLE IF EXISTS `post`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post` (
  `post_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `post_type` enum('TEXT','IMAGE','VIDEO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `media_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `like_cnt` int NOT NULL DEFAULT '0',
  `comment_cnt` int NOT NULL DEFAULT '0',
  `no_of_reports` int NOT NULL DEFAULT '0',
  `is_hidden` tinyint(1) NOT NULL DEFAULT '0',
  `posted_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`post_id`),
  KEY `Post_user_id_idx` (`user_id`),
  KEY `Post_posted_at_idx` (`posted_at`),
  KEY `Post_is_hidden_idx` (`is_hidden`),
  KEY `Post_no_of_reports_idx` (`no_of_reports`),
  CONSTRAINT `Post_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post`
--

LOCK TABLES `post` WRITE;
/*!40000 ALTER TABLE `post` DISABLE KEYS */;
INSERT INTO `post` VALUES ('cmhhafagx0002wvd0t25fpkjz','cmhhafagl0000wvd08ifjuhs0','IMAGE','Just finished a new project! Really excited about how it turned out.','/design-project-concept.png',3,17,0,0,'2025-11-02 05:45:44.385'),('cmhhafagx0003wvd0kqf36c2m','cmhhafags0001wvd0y77zbwhm','IMAGE','Exploring the mountains. Nature is the best therapy.','/majestic-mountain-vista.png',0,0,0,0,'2025-11-02 05:45:44.385'),('cmhhafagx0004wvd0mohxtrvi','cmhhafagl0000wvd08ifjuhs0','IMAGE','Beautiful sunset today. Stop and appreciate the moment.','/sunset-landscape.jpg',0,0,0,0,'2025-11-02 05:45:44.385'),('cmi1j5a2f0009wvnc1q01bkhu','cmi0yc1rv0000wvao8xypmkig','IMAGE','hsghyuiwuhg','https://res.cloudinary.com/duqral7bw/image/upload/v1763286317/o5rehnunzrzflzkgm7ke.jpg',0,0,0,0,'2025-11-16 09:45:17.365'),('cmi1k1i1j000vwvnc7rme9l14','cmhh8zmts0000wv6cnbbv1ifa','TEXT','this is test','https://res.cloudinary.com/duqral7bw/raw/upload/v1763287821/w51ur0hfhircfch89sql..txt',0,0,0,0,'2025-11-16 10:10:20.695'),('cmi1k1iwp000xwvnc9ugv7tdr','cmhh8zmts0000wv6cnbbv1ifa','TEXT','this is test','https://res.cloudinary.com/duqral7bw/raw/upload/v1763287822/f45rxlv6defkq5babrhb..txt',0,0,0,0,'2025-11-16 10:10:21.816'),('cmi1k1jp7000zwvncqjcxk3r3','cmhh8zmts0000wv6cnbbv1ifa','TEXT','this is test','https://res.cloudinary.com/duqral7bw/raw/upload/v1763287823/rvd3bjngpmigcodse29l..txt',0,0,0,0,'2025-11-16 10:10:22.842'),('cmi1k1x810011wvncjrbwcytg','cmhh8zmts0000wv6cnbbv1ifa','TEXT','this is test','https://res.cloudinary.com/duqral7bw/raw/upload/v1763287840/witpkrfxzvsdfjpqwhsr..txt',0,0,0,0,'2025-11-16 10:10:40.368'),('cmi1k5hsz0013wvnco9h11kto','cmhh8zmts0000wv6cnbbv1ifa','TEXT','bisbviurbvuariej','https://res.cloudinary.com/duqral7bw/raw/upload/v1763288007/rv7jzzfn69qo4zydmcqu..txt',0,0,0,0,'2025-11-16 10:13:27.010'),('cmi1k5sv30015wvncrtvivbvd','cmhh8zmts0000wv6cnbbv1ifa','TEXT','bisbviurbvuariej','https://res.cloudinary.com/duqral7bw/raw/upload/v1763288021/yu3pyo8ygt8syy69q5kh..txt',0,0,0,0,'2025-11-16 10:13:41.337'),('cmi2d7l640001wvac57i2i54n','cmi0yc1rv0000wvao8xypmkig','IMAGE','','https://res.cloudinary.com/duqral7bw/image/upload/v1763336814/kpwimeuiptq5fnlylnfs.jpg',0,0,0,0,'2025-11-16 23:46:53.548'),('cmi2ex4a20007wv9w6p0kfpfs','cmi0yc1rv0000wvao8xypmkig','TEXT','sghcvbnmgsh','https://res.cloudinary.com/duqral7bw/raw/upload/v1763339685/hj4sq6lnt7xricgks7rw..txt',0,0,0,0,'2025-11-17 00:34:44.328'),('cmi2g94y50009wv9wpvzatmym','cmi0yc1rv0000wvao8xypmkig','IMAGE','','https://res.cloudinary.com/duqral7bw/image/upload/v1763341925/hycvdz3qpasyuxp1blfe.jpg',0,0,0,0,'2025-11-17 01:12:04.684'),('cmi2hxqpw0001wvzo3073azjd','cmhh8zmts0000wv6cnbbv1ifa','IMAGE','','https://res.cloudinary.com/duqral7bw/image/upload/v1763344751/ayxmmxexgzcblfi1bt3q.jpg',0,0,0,0,'2025-11-17 01:59:12.259'),('cmi2pneok0002wvv46k32680r','cmi2pdh320000wvv4f33rxluk','IMAGE','hsghyuiwuhg','https://res.cloudinary.com/duqral7bw/image/upload/v1763357707/zh1fx3if1i7yn0vd4omm.jpg',0,0,0,0,'2025-11-17 05:35:07.020'),('cmi2tbudt0004wvv4zp2c5mvs','cmi2pdh320000wvv4f33rxluk','IMAGE','',NULL,0,0,0,0,'2025-11-17 07:18:05.964'),('cmi2teqm30006wvv4tn2oqt8b','cmi2pdh320000wvv4f33rxluk','IMAGE','','https://res.cloudinary.com/duqral7bw/image/upload/v1763364022/ngcubkwuocclpnxbpn9h.jpg',0,0,0,0,'2025-11-17 07:20:21.051'),('cmi2tfa4p0008wvv45y58e0np','cmi2pdh320000wvv4f33rxluk','IMAGE','','https://res.cloudinary.com/duqral7bw/image/upload/v1763364048/evfugl6x07ux6qoykcvd.jpg',0,0,0,0,'2025-11-17 07:20:46.344'),('cmi2tfm96000awvv4kurf1xmt','cmi2pdh320000wvv4f33rxluk','IMAGE','','https://res.cloudinary.com/duqral7bw/image/upload/v1763364063/mxfmew2ywkac9adzmgk1.jpg',0,0,0,0,'2025-11-17 07:21:02.058');
/*!40000 ALTER TABLE `post` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report`
--

DROP TABLE IF EXISTS `report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report` (
  `report_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `post_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reported_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`report_id`),
  KEY `Report_post_id_idx` (`post_id`),
  KEY `Report_user_id_idx` (`user_id`),
  KEY `Report_reported_at_idx` (`reported_at`),
  CONSTRAINT `Report_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `post` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Report_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report`
--

LOCK TABLES `report` WRITE;
/*!40000 ALTER TABLE `report` DISABLE KEYS */;
/*!40000 ALTER TABLE `report` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reportmonitor`
--

DROP TABLE IF EXISTS `reportmonitor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reportmonitor` (
  `post_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_of_reports` int NOT NULL,
  `status` int NOT NULL,
  PRIMARY KEY (`post_id`),
  KEY `ReportMonitor_status_idx` (`status`),
  KEY `ReportMonitor_no_of_reports_idx` (`no_of_reports`),
  CONSTRAINT `ReportMonitor_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `post` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reportmonitor`
--

LOCK TABLES `reportmonitor` WRITE;
/*!40000 ALTER TABLE `reportmonitor` DISABLE KEYS */;
/*!40000 ALTER TABLE `reportmonitor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hashed` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bio` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_type` enum('PUBLIC','PRIVATE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PUBLIC',
  `follower_cnt` int NOT NULL DEFAULT '0',
  `following_cnt` int NOT NULL DEFAULT '0',
  `post_cnt` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `User_user_name_key` (`user_name`),
  UNIQUE KEY `User_email_key` (`email`),
  KEY `User_account_type_idx` (`account_type`),
  KEY `User_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('cmhh8zmts0000wv6cnbbv1ifa','Dark_Matter','Sujith','sujithdondapati7@gmail.com','$2b$10$Ht0Zy9uppLCHj7o6Z2Ohh./6NxxhThNt2teJbG3dabRiUoUlXYybS',NULL,'PUBLIC',5,4,7,'2025-11-02 05:05:34.289','2025-11-17 08:25:07.728',NULL),('cmhhafagl0000wvd08ifjuhs0','sarah_designs','Sarah Designs','sarah@example.com','$2b$10$17SyIwTSdMn2JavsNmJ/rOv31eJbDpOHZWFCRTNM6ZPKpsxRNY3oi',NULL,'PUBLIC',2,0,0,'2025-11-02 05:45:44.373','2025-11-16 09:36:33.635',NULL),('cmhhafags0001wvd0y77zbwhm','john_dev','John Dev','john@example.com','$2b$10$17SyIwTSdMn2JavsNmJ/rOv31eJbDpOHZWFCRTNM6ZPKpsxRNY3oi',NULL,'PUBLIC',1,0,0,'2025-11-02 05:45:44.381','2025-11-02 08:36:18.543',NULL),('cmhszi1ga0000wvjs55z3cbl7','Dark_Matter_23','Sujith','mc240041012@iiti.ac.in','$2b$10$wZgfNvVTWdZJMtNDx3oyPebtQJfv5obeyEAY2sqeuouE8mLNJ0V92',NULL,'PRIVATE',0,0,0,'2025-11-10 10:13:11.002','2025-11-10 10:13:11.002',NULL),('cmi0yc1rv0000wvao8xypmkig','your_username','Sujith\'s Team','a@df.in','$2b$10$I5pprPoQna7UWdzPZjMuuuZWjqTreczTyXuHT9hcvoqU.uJ4lGK2O','','PRIVATE',2,5,4,'2025-11-16 00:02:41.274','2025-11-17 03:16:36.648','https://res.cloudinary.com/duqral7bw/image/upload/v1763285964/jes7kjqwuvsutul1ndpc.png'),('cmi2pdh320000wvv4f33rxluk','user1','user1','user1@gmail.com','$2b$10$muqgSyKQH7/T1trQU1JDLucPMIGL1jkht44g5DtfzQiccllsfzyK6',NULL,'PRIVATE',0,1,5,'2025-11-17 05:27:23.575','2025-11-17 08:25:07.728',NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-17 14:15:13
