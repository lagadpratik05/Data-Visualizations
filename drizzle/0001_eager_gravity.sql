CREATE TABLE `columns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`datasetId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`dataType` varchar(50) NOT NULL,
	`nullCount` int DEFAULT 0,
	`uniqueCount` int DEFAULT 0,
	`minValue` text,
	`maxValue` text,
	`avgValue` decimal(15,4),
	`stdDev` decimal(15,4),
	`sampleValues` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `columns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `datasets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`rowCount` int DEFAULT 0,
	`columnCount` int DEFAULT 0,
	`fileSize` int DEFAULT 0,
	`mimeType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `datasets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kpis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`datasetId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`columnId` int NOT NULL,
	`metricType` varchar(50) NOT NULL,
	`value` decimal(15,4),
	`previousValue` decimal(15,4),
	`trend` varchar(10),
	`lastUpdated` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kpis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `queries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`datasetId` int NOT NULL,
	`question` text NOT NULL,
	`sqlQuery` text,
	`result` json,
	`chartType` varchar(50),
	`chartData` json,
	`insights` text,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `queries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`datasetId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`chartIds` json,
	`kpiIds` json,
	`insights` text,
	`pdfUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
