# ---------- Build ----------
FROM maven:3.9.11-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .

RUN mvn dependency:go-offline -B

COPY src src

RUN mvn clean package -DskipTests

# ---------- Runtime ----------
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN addgroup -S ems \
 && adduser -S ems -G ems

COPY --from=build /app/target/*.jar app.jar

RUN mkdir -p /app/uploads \
 && chown -R ems:ems /app

USER ems

EXPOSE 8081

ENTRYPOINT ["java","-jar","app.jar"]