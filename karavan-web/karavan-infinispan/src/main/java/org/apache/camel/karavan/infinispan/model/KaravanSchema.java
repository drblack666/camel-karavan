package org.apache.camel.karavan.infinispan.model;

import org.infinispan.protostream.GeneratedSchema;
import org.infinispan.protostream.annotations.AutoProtoSchemaBuilder;

@AutoProtoSchemaBuilder(
        includeClasses = {
                GroupedKey.class,
                Project.class,
                Project.Type.class,
                ProjectFile.class,
                PipelineStatus.class,
                CamelStatus.class,
                CamelStatus.Name.class,
                DeploymentStatus.class,
                ContainerStatus.class,
                ContainerStatus.CType.class,
                ServiceStatus.class,
                DevModeStatus.class,
                ContainerInfo.class
        },
        schemaFileName = "karavan.proto",
        schemaFilePath = "proto/",
        schemaPackageName = "karavan")
public interface KaravanSchema extends GeneratedSchema {
}


