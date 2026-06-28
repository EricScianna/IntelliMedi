using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IntelliMedi.API.Migrations
{
    /// <inheritdoc />
    public partial class RimuoviDescrizioneAppuntamento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Descrizione",
                table: "Appuntamenti");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Descrizione",
                table: "Appuntamenti",
                type: "TEXT",
                nullable: true);
        }
    }
}
