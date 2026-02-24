import { DataTypes, Model } from "sequelize";
import { sequelize } from "../lib/db";

export class Deployment extends Model {
  public id!: number;
  public title!: string;
  public time!: Date;
  public teamIssuer!: string;
  public issuerName!: string;
  public crq!: string | null;
  public rlm!: string | null;
  public mopLink!: string | null;
}

Deployment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    teamIssuer: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    issuerName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    crq: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rlm: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mopLink: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Deployment",
    tableName: "deployments",
    timestamps: true,
  },
);
